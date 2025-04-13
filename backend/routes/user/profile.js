const express = require('express');
const db = require("../../config/db");

const upload = require('../../config/multer');  // Import multer configuration
const {getUserToken, generateJWT, verifyToken} = require('../../config/jwt'); // Import JWT verification middleware

//const { parse } = require('dotenv');
const router = express.Router();



router.post('/', verifyToken,  upload.Profile.single('profilePic'), async (req, res) => {
    const { username, biography, nationality, sex, status, birthdate } = req.body ?? {};  // Destructure the request body
    
    const verifySex = ['Male', 'Female'];
    const verifyStatus = ['public', 'private', 'restricted'];
    const birthdayRegex = /^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])-\d{4}$/;
    
    const hasAnyUpdate =
        username !== undefined ||
        biography !== undefined ||
        nationality !== undefined ||
        sex !== undefined ||
        status !== undefined ||
        birthdate !== undefined ||
        req.file !== undefined; // Check if any of the fields are present
  
    if (!hasAnyUpdate) {
        return res.status(400).json({ error: 'No update fields provided' });
        }   

    if ( // check each data formats
        (username  !== undefined    && typeof username !== 'string') ||
        (biography  !== undefined   && typeof biography !== 'string') ||
        (nationality  !== undefined && typeof nationality !== 'string') ||
        (sex  !== undefined         && !verifySex.includes(sex)) ||
        (status  !== undefined      && !verifyStatus.includes(status)) ||
        (birthdate  !== undefined   && !birthdayRegex.test(birthdate))) {
        return res.status(400).json({ error: "Invalid data format" });
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
    if (req.file !== undefined) {
        updates.push(`picture = $${i++}`);
        values.push(req.file.filename); // or req.file.path
      }
    
    
    const userId = req.user.payload.user_id; // Get the user ID from the token
    console.log(userId);
    const query = `UPDATE user_profile SET ${updates.join(', ')} WHERE id = $${i} RETURNING *;`;
    values.push(userId); // Add the ID as the last value

    try {
        const result = await db.query(query, values);
        if (result.rows.length === 0) {
          return res.status(404).json({ error: 'User not found' });
        }
        res.status(200).json({
          message: `User(${username}) updated successfully.`
        });
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Database error while updating user' });
      }
});

router.get('/:username', async (req, res)  => {
    const username = req.params.username; // Get the username from the URL
    const {n = 0, sessiontoken} = req.body || {}; 
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
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

module.exports = router;
