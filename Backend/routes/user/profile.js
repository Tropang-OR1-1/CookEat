const express = require('express');
const db = require("../../config/db");

const tagsHandler = require('../../config/tags');

const upload = require('../../config/multer');  // Import multer configuration
const { verifyToken } = require('../../config/jwt'); // Import JWT verification middleware

const { validateArrayInput, isValidUUID, canAccessUserData,
      allowedSex, allowedNationalities, allowedStatus } = require('../../config/defines');
require('dotenv').config({ path: '../.env' });

const { saveFile, deleteFile, computeFileHash } = require('../../config/uploads');
const logger = require('../../config/logger'); // Import the logger

const isvalidbiographyLength = (biography) => { return biography.length <= process.env.MAX_BIOGRAPHY_LENGTH; }

const router = express.Router();

router.post('/profile', verifyToken,  
    upload.userMedia.fields([
      { name: 'profile', maxCount: 1 },
      { name: 'background', maxCount: 1 }
      ]), async (req, res) => {
    const { username, biography, nationality, sex, status, birthdate } = req.body ?? {};  // Destructure the request body
    let { tags } = req.body ?? {};

    const userId = req.user.id; // Get the user ID from the token 
    const birthdayRegex = /^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])-\d{4}$/;
    
    const profileFile = req.files?.profile?.[0];
    const backgroundFile = req.files?.background?.[0];

    const hasAnyUpdate =
        username !== undefined ||
        biography !== undefined ||
        nationality !== undefined ||
        sex !== undefined ||
        status !== undefined ||
        birthdate !== undefined ||
        profileFile !== undefined ||
        backgroundFile !== undefined; // Check if any of the fields are present
 

    if ( // check each data formats
        (username  !== undefined    && typeof username !== 'string') ||
        (biography  !== undefined   && typeof biography !== 'string') ||
        (nationality  !== undefined && typeof nationality !== 'string') ||
        (sex  !== undefined         && typeof sex !== 'string') ||
        (status  !== undefined      && typeof status !== 'string') ||
        (birthdate  !== undefined   && typeof birthdate !== 'string')) {
        return res.status(400).json({ error: "Invalid data format(data must be string)." });
        }
    
    if (typeof nationality === 'string' && !allowedNationalities(nationality))
      return res.status(400).json({ error: `Invalid ${nationality}`, accepts: allowedNationalities });
    if (typeof sex === 'string' && !allowedSex.includes(sex))
      return res.status(400).json({ error: `Invalid ${sex}`, accepts: allowedSex });
    if (typeof status === 'string' && !allowedStatus.includes(status))
      return res.status(400).json({ error: `Invalid ${status}`, accepts: allowedStatus });
    if (typeof birthdate === 'string' && !birthdayRegex.test(birthdate))
      return res.status(400).json({ error: `Invalid ${birthdate}`, accepts: 'DD-MM-YYYY format.' });
    
    if (typeof biography === "string" && !isvalidbiographyLength(biography))
      return res.status(400).json({ error: `biography is too long. max ${process.env.MAX_BIOGRAPHY_LENGTH}` });


    if (tags !== undefined){
      let maxItem = parseInt(process.env.USER_TAGS_MAX_ITEM) || 20;
      let maxCharLength = parseInt(process.env.USER_TAGS_MAX_CHAR_LENGTH) || 20;
      const processed_tags = validateArrayInput(tags, {maxLength: maxCharLength, maxItems: maxItem});
      if (!processed_tags.success)
          return res.status(400).json({ error: processed_tags.error });
      else tags  = processed_tags.data;
      }

    else if (!hasAnyUpdate && tags === undefined) {
        return res.status(400).json({ error: 'No update fields provided.' });
        }  
    
    const updates = [];
    const values = [];
    let i = 1;
    
    if (username !== undefined) {
        updates.push(`username = $${i++}`);
        values.push(username);
      }
    if (biography !== undefined) {
        updates.push(`biography = $${i++}`);
        values.push(biography);
      }
    if (nationality !== undefined) {
        updates.push(`nationality = $${i++}`);
        values.push(nationality);
      }
    if (sex !== undefined) {
        updates.push(`sex = $${i++}`);
        values.push(sex);
      }
    if (status !== undefined) {
        updates.push(`status = $${i++}`);
        values.push(status);
      }
    if (birthdate !== undefined) {
        updates.push(`birthday = $${i++}`);
        values.push(birthdate);
      }
    
    updates.push(`updated_at = NOW()`); // Always update the timestamp

    //updates.push(`updated_at = NOW()`); // Always update the timestamp
    const query = `UPDATE user_profile SET ${updates.join(', ')} WHERE id = $${i} RETURNING 
        biography, username, nationality, sex, status, birthday, public_id, created_at
        ;`;
    values.push(userId); // Add the ID as the last value
    let result;
    const client = await db.connect();
    try {
        await client.query('BEGIN;');

        result = await client.query(query, values);
        if (result.rows.length === 0) {
          return res.status(404).json({ error: 'User not found.' });
          }

        if (tags !== undefined){ // perform tags linking
            await tagsHandler.updateTagsToEntity(client, userId, tags, 'user');
            }
        
        if (profileFile !== undefined) {
          const pname = await updateUserMedia(client, userId, 'profile', profileFile, process.env.USER_PROFILE_DIR);
          result.rows[0].profile = pname;
          }
        if (backgroundFile !== undefined){
          const bname = await updateUserMedia(client, userId, 'background', backgroundFile, process.env.USER_BACKGROUND_DIR);
          result.rows[0].background = bname;
          }

        logger.info(`User profile updated successfully for user_id: ${userId}`);
        await client.query('COMMIT;');
        return res.status(200).json({message: `Userprofile updated successfully.`, User: result.rows[0]});
      } catch (error) {

        logger.error(`Error while updating user: ${error.stack || error.message}`);
        await client.query('ROLLBACK;');
        res.status(500).json({ error: 'Database error while updating user' });
        } finally {
          client.release();
        }
});


router.get('/profile/:owner_id', verifyToken, async (req, res) => {
    const { owner_id: raw_owner_id } = req.params;
    const userId = req.user.id;
    let owner_id = raw_owner_id;

    try {
        // If requesting own profile
        if (owner_id === "me") {
            const { rows } = await db.query(
                `SELECT public_id FROM user_profile WHERE id = $1;`,
                [userId]
            );
            if (!rows.length)
                return res.status(404).json({ error: 'User not found.' });
            owner_id = rows[0].public_id;
        } else if (!isValidUUID(owner_id)) {
            return res.status(400).json({ error: "user_id must be a valid UUID." });
        }

        // Combined query for user_profile and usermedia (profile & background)
        const profileQuery = `
            SELECT u.id, u.username, u.biography, u.nationality, u.sex, u.status, u.birthday,
                   profile_media.fname AS profile_picture,
                   background_media.fname AS background_picture
            FROM user_profile u
            LEFT JOIN usermedia profile_media 
              ON profile_media.user_id = u.id AND profile_media.type = 'profile'
            LEFT JOIN usermedia background_media 
              ON background_media.user_id = u.id AND background_media.type = 'background'
            WHERE u.public_id = $1
            LIMIT 1;
        `;
        let result = await db.query(profileQuery, [owner_id]);

        if (!result.rows.length)
            return res.status(404).json({ error: 'User not found.' });

        const user = result.rows[0];

        const access = await canAccessUserData(userId, user.id);

        // Limited access: only public info
        if (!access.success) {
            return res.status(200).json({
                Profile: {
                    public_id: owner_id,
                    username: user.username,
                    picture: user.profile_picture || null,
                }
            });
        }

        // Fetch user tags
        const tagsQuery = `
            SELECT t.name FROM user_tags u
            JOIN tags t ON t.id = u.tags_id
            WHERE u.user_id = $1;
        `;
        const tagsResult = await db.query(tagsQuery, [user.id]);

        // Final response
        return res.status(200).json({
            Profile: {
                public_id: owner_id,
                username: user.username,
                biography: user.biography,
                nationality: user.nationality,
                sex: user.sex,
                status: user.status,
                birthday: user.birthday,
                picture: user.profile_picture || null,
                background: user.background_picture || null,
                tags: tagsResult.rows.map(tag => tag.name)
            }
        });
    } catch (err) {
        logger.error(`Error in /profile/${raw_owner_id}: ${err.stack || err.message}`);
        return res.status(500).json({ error: 'Database error.' });
    }
});






const updateUserMedia = async (client, user_id, type, fstream, dir) => {
    const fhash = computeFileHash(fstream.buffer);
    try {
        // Check if a file with the same hash already exists
        const { rows } = await client.query(
            `SELECT fname FROM usermedia WHERE user_id = $1 AND type = $2 AND file_hash = $3`,
            [user_id, type, fhash]
        );
        if (rows.length) return rows[0].fname; // File already exists
        
        // Save new file to disk
        const fname = await saveFile(dir, fstream);

        // Check if there's an existing file of the same type (to delete later)
        const { rows: existing } = await client.query(
            `SELECT fname FROM usermedia WHERE user_id = $1 AND type = $2`,
            [user_id, type]
        );
        const oldfname = existing[0]?.fname;

        // Insert or update the usermedia record
        const app =await client.query(
            `INSERT INTO usermedia (user_id, fname, type, file_hash)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (user_id, type)
             DO UPDATE SET fname = EXCLUDED.fname, file_hash = EXCLUDED.file_hash, created_at = NOW()`,
            [user_id, fname, type, fhash]
        );
        if (oldfname) deleteFile(dir, oldfname);
        return fname;
    } catch (err) {
        logger.error(`Error in updateUserMedia: ${err.stack}`);
        return undefined;
    }
};



module.exports = router;
