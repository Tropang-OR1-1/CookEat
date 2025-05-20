//const db = require('./db');
const path = require('path');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs').promises;
require('dotenv').config({ path: '../.env' });
const { allowedImageTypes, allowedMediaTypes } = require('./defines');

const insertMedia = async ({
    client,
    files,
    targetId,
    tableName,
    foreignKey,
    imageDir,
    videoDir,
    includeStepNumbers = false
}) => {
    console.log(includeStepNumbers);
    try {
        if (!files || files.length === 0) {
            return { success: false, error: 'No media files provided' };
        }
        let stepNumber = 1;
        for (const file of files) {
            const extname = path.extname(file.originalname).toLowerCase();

            const mediaType = allowedImageTypes.includes(extname)
                ? 'image'
                : allowedMediaTypes.includes(extname)
                ? 'video'
                : null;

            if (!mediaType) {
                return { success: false, error: `Invalid file type${includeStepNumbers ? ` at step ${stepNumber}` : ''}` };
            }
            const dirPath = mediaType === 'image' ? imageDir : videoDir;
            if (!dirPath) {
                return { success: false, error: 'Storage directory not configured' };
            }

            const fileHash = await computeFileHash(file.buffer);

            const existing = await client.query(
                `SELECT 1 FROM ${tableName} WHERE file_hash = $1 AND ${foreignKey} = $2`,
                [fileHash, targetId]
            );
            if (existing.rows.length > 0) {
                console.log(`Duplicate media skipped: ${file.originalname}`);
                if (includeStepNumbers) stepNumber++;
                continue;
            }

            const randomFilename = `${uuidv4()}${extname}`;
            const filePath = path.join(dirPath, randomFilename);

            await fs.writeFile(filePath, file.buffer);

            const columns = [foreignKey, 'fname', 'media_type', 'file_hash'];
            const values = [targetId, randomFilename, mediaType, fileHash];

            if (includeStepNumbers) {
                columns.push('number');
                values.push(stepNumber);
            }

            const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');

            await client.query(
                `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`,
                values
            );

            if (includeStepNumbers) stepNumber++;
        }

        return { success: true };
    } catch {
        return { success: false, error: 'Error inserting media' };
    }
};

const updateMedia = async ({
    client,
    files,
    targetId,
    tableName,
    idColumn,
    imageDir,
    videoDir,
    includeStepNumbers = false
}) => {
    try {
        if (!files || files.length === 0) {
            return { success: false, error: 'No files provided for update' };
        }

        //const result = await insertMedia(files, targetId, tableName, idColumn, imageDir, videoDir);
        const result = await insertMedia({
            client,
            files,
            targetId,
            tableName,
            foreignKey: idColumn, // match naming!
            imageDir,
            videoDir,
            includeStepNumbers
            });
        

        if (!result.success) {
            console.log(result.error);

            return { success: false, error: result.error };
        }
        const uploadedHashes = await Promise.all(
                files.map(file => computeFileHash(file.buffer))
            );
        
        await cleanupMedia(client, targetId, uploadedHashes, tableName, idColumn, imageDir, videoDir);
        return { success: true };
    } catch (error) {
        console.error('Error in updateMedia:', error);
        return { success: false, error: 'Error updating media' };
    }
};


const deleteMedia = async ({
    client,
    targetId,
    tableName,
    idColumn,
    imageDir,
    videoDir,
    mediaType = 'all'
}) => {
    try {
        let query = `SELECT fname, media_type FROM ${tableName} WHERE ${idColumn} = $1`;
        const queryParams = [targetId];

        if (mediaType !== 'all') {
            query += ' AND media_type = $2';
            queryParams.push(mediaType);
        }

        const { rows } = await client.query(query, queryParams);

        if (rows.length > 0) {
            const deleteQuery = mediaType === 'all'
                ? `DELETE FROM ${tableName} WHERE ${idColumn} = $1`
                : `DELETE FROM ${tableName} WHERE ${idColumn} = $1 AND media_type = $2`;

            await client.query(deleteQuery, [targetId, mediaType].slice(0, mediaType === 'all' ? 1 : 2));

            const deleteFiles = rows.map(({ fname, media_type }) => {
                const baseDir = media_type === 'image' ? imageDir : videoDir;
                const filePath = path.join(baseDir, fname);
                return fs.unlink(filePath).catch(() => {});
            });

            await Promise.all(deleteFiles);
        }
    } catch (err) {
        console.error('Error during media delete:', err);
    }
};


const cleanupMedia = async (client, targetId, keepHashes, tableName, idColumn, imageDir, videoDir) => {
    try {

        const { rows } = await client.query(
            `SELECT fname, file_hash, media_type FROM ${tableName} WHERE ${idColumn} = $1`,
            [targetId]
        );
        for (const media of rows) {
            if (!keepHashes.includes(media.file_hash)) {
                const dirPath = media.media_type === 'image' ? imageDir : videoDir;
                const filePath = path.join(dirPath, media.fname);

                await client.query(
                    `DELETE FROM ${tableName} WHERE ${idColumn} = $1 AND file_hash = $2`,
                    [targetId, media.file_hash]
                );

                console.log(`Deleting: ${targetId} - ${media.file_hash}`);
                await fs.unlink(filePath).catch(() => {});
            }
        }
    } catch (err) {
        console.error('Error during media cleanup:', err);
    }
};


const deleteFile = (folderPath, filename) => {
    const fullPath = path.join(folderPath, filename);
    fs.unlink(fullPath, (err) => {
        if (err) {
            console.warn('Failed to delete file:', fullPath, err.message);
        } else {
            console.log('Deleted old file:', fullPath);
        }
    });
};

const saveFile = async (directory, file) => {
    // Validate if the file type is allowed (optional, based on your defines)
    const fileType = path.extname(file.originalname).toLowerCase();
    if (![...allowedImageTypes, ...allowedMediaTypes].includes(fileType)) {
        throw new Error('Invalid file type');
    }

    // Generate a unique filename for the file using UUID
    const filename = `${uuidv4()}${fileType}`; // Use uuidv4 to create a unique filename
    // Define the destination path for saving the file
    const destination = path.join(directory, filename);

    // Ensure the destination folder exists
    try {
        await fs.mkdir(directory, { recursive: true });
    } catch {
        throw new Error('Failed to create directory');
    }

    // Write the file buffer to the disk
    try {
        await fs.writeFile(destination, file.buffer);
    } catch {
        throw new Error('Failed to save file');
    }
    return filename; // Return the filename to be stored in the database
};


const computeFileHash = (buffer) => {
    const hash = crypto.createHash('sha256');
    hash.update(buffer);  // Directly update with the buffer
    return hash.digest('hex');  // Return the hash as a hexadecimal string
    };

async function copyDefaultPfpToProfileDir() {
    const defaultPath = process.env.DEFAULT_PROFILE_PATH;
    const destDir = process.env.USER_PROFILE_DIR;

    if (!defaultPath || !destDir) {
        throw new Error('DEFAULT_PFP_PATH or PROFILE_PIC_DIR is not set in .env');
    }

    // Ensure the directory exists
    try {
        await fs.mkdir(destDir, { recursive: true });
    } catch (err) {
        throw new Error(`Failed to create directory: ${destDir}\n${err}`);
    }

    const ext = path.extname(defaultPath); // e.g., ".png"
    const newFilename = `${uuidv4()}${ext}`;
    const destPath = path.join(destDir, newFilename);

    try {
        await fs.copyFile(defaultPath, destPath);
    } catch (err) {
        throw new Error(`Failed to copy default PFP: ${err}`);
    }

    return newFilename;
}

module.exports = {  insertMedia, cleanupMedia, updateMedia, deleteMedia,
                    deleteFile, saveFile, copyDefaultPfpToProfileDir, computeFileHash };