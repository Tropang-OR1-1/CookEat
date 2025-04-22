const express = require('express');
const db = require("../../config/db");

const tagsHandler = require('../../config/tags');

const upload = require('../../config/multer');  // Import multer configuration
const {getUserToken, generateJWT, verifyToken} = require('../../config/jwt'); // Import JWT verification middleware
const { validateArrayInput, usernameRegex,
      allowedSex, allowedNationalities, allowedStatus } = require('../../config/defines');
require('dotenv').config({ path: '../.env' });

const { deleteFile } = require('../../config/uploads');

const isvalidbiographyLength = (biography) => { return biography.length <= process.env.MAX_BIOGRAPHY_LENGTH; }

const router = express.Router();


// verifyToken already making sure that the token do exist in the user_profile. no need to double check
router.post('/profile', verifyToken,  upload.Profile.single('profile'), async (req, res) => {
    const { username, biography, nationality, sex, status, birthdate } = req.body ?? {};  // Destructure the request body
    let { tags } = req.body ?? {};

    const userId = req.user.id; // Get the user ID from the token 
    const birthdayRegex = /^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])-\d{4}$/;
    
    const hasAnyUpdate =
        username !== undefined ||
        biography !== undefined ||
        nationality !== undefined ||
        sex !== undefined ||
        status !== undefined ||
        birthdate !== undefined ||
        req.file !== undefined; // Check if any of the fields are present
 

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
    if (typeof birthday === 'string' && !birthdayRegex.test(birthdate))
      return res.status(400).json({ error: `Invalid ${birthday}`, accepts: 'DD-MM-YYYY format.' });
    
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
        return res.status(400).json({ error: 'No update fields provided' });
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

    let oldFilename = null;
    if (req.file !== undefined) {
        updates.push(`picture = $${i++}`);
        values.push(req.file.filename); // or req.file.path
        
        const { rows } = await db.query(`SELECT picture FROM user_profile WHERE id = $1;`, [userId]);
        oldFilename = rows[0].picture;
        console.log(oldFilename);
      }

    const query = `UPDATE user_profile SET ${updates.join(', ')} WHERE id = $${i} RETURNING *;`;
    values.push(userId); // Add the ID as the last value
    
    const client = await db.connect();
    try {
        await client.query('BEGIN;');
        if (values.length > 1){
          const result = await client.query(query, values);
          if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found.' });
            }
          }

        if (tags !== undefined){ // perform tags linking
            await tagsHandler.updateTagsToEntity(client, userId, tags, 'user');
            }
        
        if (oldFilename !== null){
          console.log("deleting file: " + oldFilename);
          deleteFile(process.env.PROFILE_DIR, oldFilename);
          }
        await client.query('COMMIT;');
        return res.status(200).json({message: `Userprofile updated successfully.`});
      } catch (error) {
        console.error(error);
        await client.query('ROLLBACK;');
        res.status(500).json({ error: 'Database error while updating user' });
        } finally {
          client.release();
        }
});

router.get('/:username', async (req, res)  => {
    const username = req.params.username; // Get the username from the URL
    const {n = 0, sessiontoken} = req.body || {}; 
    if (!usernameRegex.test(username)) {
        return res.status(400).json({ error: 'Invalid username format' });
        } // Validate the username format

    let sessionId = getUserToken(req); // to check if the user can see the profile
    
    console.log(sessionId);
    if (n === undefined || typeof n !== 'number') n = 0;
    const query = `SELECT biography, username, nationality, sex, status, picture \
            FROM user_profile WHERE username = $1 OFFSET $2 LIMIT 1;`;
    const result = await db.query(query, [username, n]);
    if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
        } // Check if the user exists
    

    result.rows[0].picture = (result.rows[0].picture !== null) ?  
        generateJWT(result.rows[0].picture, process.env.MEDIA_SESSION_EXP) :
        null; // Tokenize the picture

    // Status Handling
    if ((sessionId !== null && sessionId == result.rows[0].id) || result.rows[0].status == "public") { // check if the user is the owner of the profile or if the profile is public
        return res.status(200).json(result.rows[0]); // Allow access to own profile
        }

    else if (result.rows[0].status == "restricted" && sessionId !== null) { // check if the user 
        const query1 = `SELECT * FROM followers WHERE following_user_id = $1 AND followed_user_id = $2;`;
        const result1 = await db.query(query1, [result.rows[0].id, sessionId]);
        if (result1.rows.length) 
            return res.status(200).json(result.rows[0]); // Allow access to followed profile
            } // Check if the user exists

    res.status(200).json({
        "username": result.rows[0].username,
        "picture": result.rows[0].picture 
        }); // Send the user data back to the client
    
    });


const linkTagsToUser = async (tags, userId) => {
    const client = await db.connect();
    try {
        await client.query('BEGIN');

        // Step 1: Delete existing user_tag links
        await client.query('DELETE FROM user_tags WHERE user_id = $1', [userId]);

        // Step 2: Insert new tags if they don't exist
        const insertTagsQuery = `
            INSERT INTO tags (name)
            SELECT unnest($1::text[])
            ON CONFLICT (name) DO NOTHING;
        `;
        await client.query(insertTagsQuery, [tags]);

        // Step 3: Fetch IDs of the new tags
        const selectTagIdsQuery = `
            SELECT id FROM tags WHERE name = ANY($1)
        `;
        const tagResult = await client.query(selectTagIdsQuery, [tags]);
        const tagIds = tagResult.rows.map(row => row.id);

        // Step 4: Link new tags to the user
        const insertUserTagsQuery = `
            INSERT INTO user_tags (user_id, tags_id)
            SELECT $1, unnest($2::int[])
            ON CONFLICT DO NOTHING;
        `;
        await client.query(insertUserTagsQuery, [userId, tagIds]);

        await client.query('COMMIT');
        return { success: true };
    } catch (err) {
        await client.query('ROLLBACK');
        return { success: false, error: err };
    } finally {
        client.release();
    }
};


module.exports = router;
