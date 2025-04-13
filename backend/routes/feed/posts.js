const express = require('express');
const db = require("../../config/db");
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

const { allowedStatus, allowedMediaTypes, allowedImageTypes,
        queryStatus, queryPPID, tagsValidator, isvalidtitleLength,
        fetchPostOwner, hasUploadedFiles, tagsNormalize, isAlphanumeric,
        sanitizeInput,
        isValidUUID
        } = require('../../config/defines');

const upload = require('../../config/multer');  // Import multer configuration
const { verifyToken } = require('../../config/jwt'); // Import JWT verification middleware

const router = express.Router();

//  verifyToken,  

router.post('/',verifyToken ,upload.Media.array('media', process.env.MAX_POST_MEDIA), async (req, res) => {
    let { visibility, tags, title, content } = req.body ?? {}; // Destructure the request body

    if (!title) {
        return res.status(400).json({ error: "Titles are required." });
        } // make sure title and content are provided
    if (!isvalidtitleLength(title)) {
        return res.status(400).json({ error: "Title is too long." });
        } // check title length
    
    if (!content) content = "";
    
    if ((title !== undefined && typeof title !== 'string') ||
        (content !== undefined && typeof content !== 'string')
        ) return res.status(400).json({ error: "Data must be strings." });
    
    tags = tagsNormalize(tags);
    if (tags !== undefined && !tagsValidator(tags))
        { return res.status(400).json({ error: "Tags must be an array of strings." }); } // check tags format
    
    const userId = req.user.payload.user_id; // Get the user ID from the token
    
    if (visibility === undefined) { // fetch the user status if not provided
        const decoded = await queryStatus(userId);  // await the async function
        if (!decoded.success) return res.status(400).json({ error: decoded.error });  // handle the error
        visibility = decoded.status;  // assign the retrieved status to the visibility of the psot
        }
    else if (typeof visibility !== 'string' || !allowedStatus.includes(visibility)) {
        return res.status(400).json({ error: 'Invalid status value.' });
        }

    title = sanitizeInput(title);
    content = sanitizeInput(content);

    querypost = 'INSERT INTO posts (title, content, user_id, visibility) VALUES ($1, $2, $3, $4) RETURNING id, public_id';
    const postResult = await db.query(querypost, [title, content, userId, visibility]);
    const {id, public_id} = postResult.rows[0]; // Get the ID of the newly created post
    const postId = id;
    
    if (tags !== undefined){ // perform tags linking
        console.log(tags);
        linkTagsToPost(tags, postId);
        }

    if (hasUploadedFiles(req.files)){
        const insertmedia = await insertPostMedia(req.files, postId);
        if (!insertmedia.success)
            return res.status(400).json({error: insertmedia.error });
        }

    return res.status(200).json({"PostID": public_id});
    });

router.post('/share', verifyToken, upload.none(), async (req, res) => {
    const { id } = req.body ?? {};
    let { status, title, content } = req.body ?? {};

    if (typeof id !== 'string'){
        return res.status(400).json({error: "Post_Id required."});
        }

    if (!isValidUUID(id)) // safety precautions
        return res.status(400).json({ error: "Invalid UUID(s) provided."});
    title = sanitizeInput(title);
    content = sanitizeInput(content);

    let rid = await queryPPID (id);
    if (!rid.success) return res.status(400).json({ error: rid.error });
    rid = rid.id; // convert public id to posts id


    if ((title !== undefined && typeof title !== 'string') ||
        (content !== undefined && typeof content !== 'string') ||
        (status !== undefined && typeof status !== 'string'))
        return res.status(400).json({error: 'Title and content must be strings if provided.'});
    
    const userId = req.user.payload.user_id; // Get the user ID from the token

    if (status === undefined) { // fetch the user status if not provided
        const decoded = await queryStatus(userId);  // await the async function
        if (!decoded.success) return res.status(400).json({ error: decoded.error });  // handle the error
        status = decoded.status;  // assign the retrieved status
        }
    else if (typeof status !== 'string' || !allowedStatus.includes(status)) {
        return res.status(400).json({ error: 'Invalid status value.' });
        }
    else if (!allowedStatus.includes(status)) {
        return res.status(400).json({ error: 'Invalid status value.' });
        }

    querypost = 'INSERT INTO posts (title, content, user_id, visibility, ref_id) VALUES ($1, $2, $3, $4, $5) RETURNING public_id';
    const postResult = await db.query(querypost, [title, content, userId, status, rid]);
    const public_id = postResult.rows[0].public_id;

    res.status(200).json({"PostID": public_id});
    });

router.put('/', verifyToken, upload.Media.array('media', process.env.MAX_POST_MEDIA), async (req, res) => {
    const { post_id, visibility, deletemedia } = req.body ?? {}; // Destructure the request body
    let { tags, title, content } = req.body ?? {};
    const pid = post_id;

    const hasAnyUpdate =
        title !== undefined ||
        content !== undefined ||
        tags !== undefined ||
        visibility !== undefined ||
        hasUploadedFiles(req.files) ||
        deletemedia !== undefined;

    if (!hasAnyUpdate) { // make sure atleast one attribute will be updated.
        return res.status(400).json({ error: 'No update fields provided' });
        } 
    
    if ( // prevent invalid data format.
        (title !== undefined  && typeof title !== 'string') ||
        (content !== undefined   && typeof content !== 'string') ||
        (tags !== undefined   && typeof tags !== 'string') ||
        (visibility !== undefined && typeof visibility !== 'string') ||
        (deletemedia !== undefined && typeof deletemedia !== 'string')
        ) return res.status(400).json({ error: "Invalid data format" });
    
    if (title === "")
        return res.status(400).json({ error: 'Title cannot be empty.' });

    if (typeof pid !== 'string'){ // require an id
        return res.status(400).json({error: "PostId required."});
        }

    if (!isValidUUID(post_id)) // security measures
        return res.status(400).json({ error: "Invalid UUID(s) provided."});
    title = sanitizeInput(title);
    content = sanitizeInput(content);

    if (title !== undefined && !isvalidtitleLength(title)) { // check title length
        return res.status(400).json({ error: "Title is too long." });
        } 
    
    tags = tagsNormalize(tags);
    if (tags !== undefined && !tagsValidator(tags))
        { return res.status(400).json({ error: "Tags must be an array of strings." }); } // check tags format
    
    if (visibility !== undefined && (typeof visibility !== 'string' || !allowedStatus.includes(visibility))) {
        return res.status(400).json({ error: 'Invalid status value.' });
        }

    let rid = await queryPPID (pid); // convert public id to posts id
    if (!rid.success) return res.status(404).json({ error: rid.error });
    rid = rid.id; 
    
    const userId = req.user.payload.user_id; // Get the user ID from the token
    
    const fetchowner = await fetchPostOwner(rid);
    if (!fetchowner.success) return res.status(400).json({error: fetchowner.error});
    // make sure user are only allowed to update his own posts.
    if (fetchowner.user_id != userId) return res.status(400).json({error: "Unathorized Update."});

    // updates 
    const updates = [];
    const values = [];
    let i = 1;

    if (title !== undefined){
        updates.push(`title = $${i++}`);
        values.push(title);
        }
    if (content !== undefined){
        updates.push(`content = $${i++}`);
        values.push(content);
        }
    
    updates.push(`updated_at = NOW()`);

    const query = `UPDATE posts SET ${updates.join(', ')} WHERE id = $${i} RETURNING public_id;`;
    values.push(rid); // Add the post ID as the last value
    
    let resultquery;
    try { resultquery = await db.query(query, values); }
    catch (error) { res.status(500).json({ error: error }); }
    
    if (tags !== undefined){ //update tags
        const result = await updatePostTags(tags, rid); 
        if (!result.success) return {success: false, error: result.error };
        }
    
    if (deletemedia === 'True'){
        try { await cleanupPostMedia(rid, []); }
        catch (err) {return {success: false, error: 'delete error.'}; }
        }
    if (hasUploadedFiles(req.files)){ // manage files
        const result = await updatePostMedia(req.files, rid);
        if (!result.success) return {success: false, error: result.error };
        }

    return res.status(200).json({msg:'Post updated successfully.', PostID: resultquery.rows[0].public_id });
    });


const insertPostMedia = async (files, postId) => {
    try {
        if (!files || files.length === 0) {
            return { success: false, error: 'No files provided' };
            }
    
        for (const file of files) {
            const extname = path.extname(file.originalname).toLowerCase();
  
            // Determine media type
            const mediaType = allowedImageTypes.includes(extname)
                ? 'image'
                : allowedMediaTypes.includes(extname)
                ? 'video'
                : null;
  
            if (!mediaType) {
                return { success: false, error: 'Invalid file type. Only images and videos are allowed' };
                }

            const dirPath = mediaType === 'image' ? process.env.IMAGE_DIR : process.env.VIDEO_DIR;
            if (!dirPath) {
                return { success: false, error: 'Upload directory not configured properly' };
                }
  
            // Compute hash of file buffer
            const fileHash = await computeFileHash(file.buffer);

            // Check for existing file with the same post
            const existing = await db.query(
                `SELECT * FROM postmedia WHERE file_hash = $1 AND post_id = $2`,
                [fileHash, postId]
                );
  
            if (existing.rows.length > 0) {
                console.log(`Duplicate file detected. Skipping save: ${file.originalname}`);
                continue; // Skip saving
                }
  
            // Generate unique filename and determine save path
            const randomFilename = `${uuidv4()}${extname}`;
            const filePath = path.join(dirPath, randomFilename);
            
            //console.log(file.buffer);
            // Write file to disk
            await fs.writeFile(filePath, file.buffer);

            // Insert media metadata into database
            await db.query(
                `INSERT INTO postmedia (post_id, fname, media_type, file_hash)
                VALUES ($1, $2, $3, $4)`,
                [postId, randomFilename, mediaType, fileHash]
                );
            }
        return { success: true };
        } catch (error) {
            console.error('Error in insertPostMedia:', error);
            return { success: false, error: 'Error inserting post media' };
            }
    }

const updatePostMedia = async (files, postId) => {
    try {
        if (files && files.length > 0) {
            // Step 1: Insert or skip duplicates using insertPostMedia
            const result = await insertPostMedia(files, postId);
            if (!result.success) {
                return { success: false, error: result.error };
                }

            // Step 2: Build list of hashes from uploaded files
            const uploadedHashes = await Promise.all(
                files.map(file => computeFileHash(file.buffer))
                );

            // Step 3: Cleanup removed files (those not in uploadedHashes)
            await cleanupPostMedia(postId, uploadedHashes);

            return { success: true };
        } else {
            return { success: false, error: 'No files provided for update' };
            }
    } catch (error) {
        console.error('Error in updatePostMediaUsingInsert:', error);
        return { success: false, error: 'Error updating post media' };
        }
};

// Cleanup media that doesn't match uploaded hashes
const cleanupPostMedia = async (postId, keepHashes) => {
    try {
        const { rows } = await db.query(
        `SELECT fname, file_hash, media_type FROM postmedia WHERE post_id = $1`,
        [postId]
        );

        for (const media of rows) {
            if (!keepHashes.includes(media.file_hash)) {
                const dirPath = media.media_type === 'image' ? process.env.IMAGE_DIR : process.env.VIDEO_DIR;
                const filePath = path.join(dirPath, media.fname);

                // Delete media from database and file system
                await db.query(`DELETE FROM postmedia WHERE post_id = $1 AND file_hash = $2`, [postId, media.file_hash]); // remove in db
                console.log(`Deleteting: ${postId}\t ${media.file_hash}`);


                await fs.unlink(filePath).catch(() => {}); //  remove in fs
                }
            }
        } catch (err) { console.error('Error during media cleanup:', err); }
    };

    
  


const updatePostTags = async (tags, postId) => {
    try { await db.query(`DELETE FROM post_tags WHERE post_id = $1`, [postId]); }
    catch (err) { return {success: false, error: err} };
    return linkTagsToPost(tags, postId);
    }

const linkTagsToPost = async (tags, postId) => {
    try {
        for (const tag of tags) { // insert postid to tags
            const querytags = `WITH insert_tag AS (INSERT INTO "tags" ("name") 
                VALUES ($1) ON CONFLICT ("name") DO NOTHING RETURNING "id")
                SELECT "id" FROM insert_tag UNION SELECT "id" FROM "tags" WHERE "name" = $1`;
            const tagResult = await db.query(querytags, [tag]); // Get the ID of the tag
            const tagId = tagResult.rows[0].id; // Get the ID of the tag

            const querylinks = 'INSERT INTO post_tags (post_id, tags_id) VALUES ($1, $2)';
            await db.query(querylinks, [postId, tagId]); // Link the post and tag
            }
        } catch (err) { return {success: false, error: err} };
    return { success: true };
    };


const computeFileHash = (buffer) => {
    const hash = crypto.createHash('sha256');
    hash.update(buffer);  // Directly update with the buffer
    return hash.digest('hex');  // Return the hash as a hexadecimal string
    };


      
module.exports = router;

