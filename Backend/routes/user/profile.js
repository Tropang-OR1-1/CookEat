const express = require('express');
const db = require("../../config/db");

const tagsHandler = require('../../config/tags');

const upload = require('../../config/multer');  // Import multer configuration
const { verifyToken } = require('../../config/jwt'); // Import JWT verification middleware

const { validateArrayInput, isValidUUID, canAccessUserData,
      allowedSex, allowedNationalities, allowedStatus } = require('../../config/defines');
require('dotenv').config({ path: '../.env' });

const { deleteFile } = require('../../config/uploads');
const logger = require('../../config/logger'); // Import the logger

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

    let oldFilename = null;
    if (req.file !== undefined) {
        updates.push(`picture = $${i++}`);
        values.push(req.file.filename); // or req.file.path
        
        const { rows } = await db.query(`SELECT picture FROM user_profile WHERE id = $1;`, [userId]);
        oldFilename = rows[0].picture;
        }

    const query = `UPDATE user_profile SET ${updates.join(', ')} WHERE id = $${i} RETURNING 
        picture, biography, username, nationality, sex, status, birthday, public_id, created_at
        ;`;
    values.push(userId); // Add the ID as the last value
    let result;
    const client = await db.connect();
    try {
        await client.query('BEGIN;');
        if (values.length > 1){
          result = await client.query(query, values);
          if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found.' });
            }
          }

        if (tags !== undefined){ // perform tags linking
            await tagsHandler.updateTagsToEntity(client, userId, tags, 'user');
            }
        
        if (oldFilename !== null){
          logger.info(`deleting profile: ${oldFilename}`);
          deleteFile(process.env.PROFILE_DIR, oldFilename);
          }
        await client.query('COMMIT;');

        logger.info(`User profile updated successfully for user_id: ${userId}`);
        return res.status(200).json({message: `Userprofile updated successfully.`, Profile: result.rows[0]});
      } catch (error) {

        logger.error(`Error while updating user: ${error.stack || error.message}`);
        await client.query('ROLLBACK;');
        res.status(500).json({ error: 'Database error while updating user' });
        } finally {
          client.release();
        }
});

router.get('/profile/:owner_id', verifyToken, async (req, res)  => {
    
    let {owner_id} = req.params ; // Get the username from the URL
    const userId = req.user.id; // Get the user ID from the token
    
    if (owner_id === "me") {
      try {
        const { rows } = await db.query(`SELECT public_id FROM user_profile WHERE id = $1;`, [userId]);
        if (rows.length === 0) return res.status(404).json({ error: 'User not found.' });
        else owner_id = rows[0].public_id;
        } catch (err) { 
          logger.error(`Error retrieving user data: ${err.stack || err.message}`);
          return res.status(500).json({ error: 'Database error.' });
          }
      }
    else if (!isValidUUID(owner_id))
        return res.status(400).json({ error: "user_id must be a valid UUID." });
    
    try {
      const query = `SELECT id, username, picture, 
          biography, nationality, sex, status, birthday
          FROM user_profile
          WHERE public_id = $1 LIMIT 1;`;

      let result = await db.query(query, [owner_id]);
      if (result.rows.length === 0) return res.status(404).json({ error: 'User not found.' });
      else result = result.rows[0];
      
      const canAccess = await canAccessUserData(userId, result.id);
      if (canAccess.success === false) // only provide limited information
          return res.status(200).json({
            Profile: {
              username: result.username, 
              picture: result.picture,
              public_id: owner_id,
              }
            });
        
      const tagsquery = `SELECT t.name FROM user_tags u JOIN tags t ON t.id = u.tags_id WHERE u.user_id = $1;`;
      const tagsresult = await db.query(tagsquery, [result.id]);
      
      delete result.id;

      return res.status(200).json({Profile: {
          public_id: owner_id,
          ...result,
          tags: tagsresult.rows.map(tag => tag.name)
          }}); // Send the user data back to the client
      } catch (err) {
        logger.error(`Error processing request for user with public_id ${owner_id}: ${err.stack || err.message}`);
        return res.status(500).json({ error: 'Database error.' });
        }
    });







module.exports = router;
