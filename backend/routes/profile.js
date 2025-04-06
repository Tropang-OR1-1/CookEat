const express = require('express');
const db = require("../config/db");

const upload = require('../config/multer');  // Import multer configuration
const jwtModule = require('../config/jwt'); // Import JWT verification middleware
const rateLimit = require("express-rate-limit");

const FailLimiter = rateLimit({ // prevent from using profile for session brute-forcing
    windowMs: 30 * 60 * 1000, // 30 minutes
    max: 30, // Limit each IP to 5 requests per windowMs
    message: "Too many failed attempts from this IP, please try again after 30 minutes",
  });

//const { parse } = require('dotenv');
const router = express.Router();



router.post('/', FailLimiter, upload.Profile.single('profilePic'), async (req, res) => {
    const {sessiontoken, userdata} = req.body;  // Destructure the request body

    if (!sessiontoken || !userdata) { // Check if both sessiontoken and userdata are provided
        return res.status(400).json({ error: "Invalid Requests Headers." });  // Ensure both are provided
        }

    if (typeof sessiontoken !== 'string') { // Check if sessiontoken is a string
            return res.status(400).json({ error: "sessiontoken must be a string." });
        }

    let result_token = jwtModule.verifyToken(sessiontoken); // Verify the session token
    if (!result_token.success) { // Check if the token is valid
        return res.status(401).json({ error: result_token.message });
        }
    
    let parsedData;
    try {
        parsedData = typeof userdata === 'string' ? JSON.parse(userdata) : userdata;
    } catch (error) {
        return res.status(400).json({ error: "Invalid JSON format for userdata." });
    }
        
    const verifySex = ['Male', 'Female'];
    const verifyStatus = ['Public', 'Private', 'Restricted'];
    const birthdayRegex = /^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])-\d{4}$/;
    
    const hasAnyUpdate =
        parsedData.username !== undefined ||
        parsedData.biography !== undefined ||
        parsedData.nationality !== undefined ||
        parsedData.sex !== undefined ||
        parsedData.status !== undefined ||
        parsedData.birthdate !== undefined ||
        req.file !== undefined; // Check if any of the fields are present
  
    if (!hasAnyUpdate) {
        return res.status(400).json({ error: 'No update fields provided' });
        }   

    if ( // check each data formats
        (parsedData.username && typeof parsedData.username !== 'string') ||
        (parsedData.biography && typeof parsedData.biography !== 'string') ||
        (parsedData.nationality && typeof parsedData.nationality !== 'string') ||
        (parsedData.sex && !verifySex.includes(parsedData.sex)) ||
        (parsedData.status && !verifyStatus.includes(parsedData.status)) ||
        (parsedData.birthdate && !birthdayRegex.test(parsedData.birthdate))) {
        return res.status(400).json({ error: "Invalid data format" });
        }
    
    const { username, biography, nationality, sex, status, birthdate } = parsedData;
    const updates = [];
    const values = [];
    let i = 1;
    
    if (parsedData.username !== undefined) {
        updates.push(`username = $${i++}`);
        values.push(parsedData.username);
      }
    if (parsedData.biography !== undefined) {
        updates.push(`biography = $${i++}`);
        values.push(parsedData.biography);
      }
    if (parsedData.nationality !== undefined) {
        updates.push(`nationality = $${i++}`);
        values.push(parsedData.nationality);
      }
    if (parsedData.sex !== undefined) {
        updates.push(`sex = $${i++}`);
        values.push(parsedData.sex);
      }
    if (parsedData.status !== undefined) {
        updates.push(`status = $${i++}`);
        values.push(parsedData.status);
      }
    if (parsedData.birthdate !== undefined) {
        updates.push(`birthday = $${i++}`);
        values.push(parsedData.birthdate);
      }
    if (req.file !== undefined) {
        updates.push(`picture = $${i++}`);
        values.push(req.file.filename); // or req.file.path
      }
    
    const userId = parseInt(result_token.decoded.userId.user_id); // Ensure userId is an integer
    if (isNaN(userId)) {
        return res.status(400).json({ error: 'Invalid request data' });
        }

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

    let sessionId = null; // to check if the user can see the profile
    if (sessiontoken !== undefined && typeof sessiontoken === 'string') {
        let result_token = jwtModule.verifyToken(sessiontoken); // Verify the session token
        if (result_token.success) { // Check if the token is valid
            sessionId = parseInt(result_token.decoded.userId.user_id); // Ensure userId is an integer
            if (!isNaN(sessionId)) sessionId = null; 
            } // Check if the token is valid
        } // Ensure userId is an integer
    

    if (n === undefined || typeof n !== 'number') n = 0;
    const query = `SELECT biography, username, nationality, sex, status, picture \
            FROM user_profile WHERE username = $1 OFFSET $2 LIMIT 1;`;
    const result = await db.query(query, [username, n]);
    if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
        } // Check if the user exists
    
    console.log(result.rows[0].picture); // Log the result for debugging

    if (result.rows[0].picture !== null) { // tokenize the picture
        result.rows[0].picture = jwtModule.generateToken(
            { userId: result.rows[0].picture },
            { expiresIn: '10m'} ); // Generate a token for the picture
        }

    // Status Handling
    if (result.rows[0].status == "private" && sessionId !== null) { // private viewing
        if (sessionId == result.rows[0].id) {
            return res.status(200).json(result.rows[0]); // Allow access to own profile
            }
        }

    else if (result.rows[0].status == "restricted" && sessionId !== null) { // check if the user 
        const query1 = `SELECT * FROM followers WHERE following_user_id = $1 AND followed_user_id = $2;`;
        const result1 = await db.query(query1, [result.rows[0].id, sessionId]);
        if (result1.rows.length) 
            return res.status(200).json(result.rows[0]); // Allow access to followed profile
        } // Check if the user exists

    else {
        return res.status(200).json(result.rows[0]); // Allow access to public profile
        } // Check if the user exists
    res.status(200).json({
        "username": result.rows[0].username,
        "picture_jwt": result.rows[0].picture 
        }); // Send the user data back to the client
    
    });

module.exports = router;
