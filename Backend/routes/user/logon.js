require("dotenv").config({ path: "../.env" });
const express = require("express"); // Initialize Express app
const bcrypt = require('bcryptjs'); // Use 'bcrypt' if you installed bcrypt, 'bcryptjs' otherwise
const router = express.Router();
router.use(express.urlencoded({ extended: true }));  // To handle form-data bodies

//const app = express(); 
const cors = require("cors");

const db = require("../../config/db");
const logger = require('../../config/logger'); // Import the logger
const upload = require("multer")();
const { usernameRegex, emailValidator, sanitizeInput } = require('../../config/defines');
const { copyDefaultMediaDir } = require('../../config/uploads'); // Import the function to copy default profile picture


const { generateJWT, verifyToken } = require('../../config/jwt'); // Import the module
const { cli } = require("winston/lib/winston/config");

router.use(cors()); // Enable CORS for all routes

async function hashPassword(email, password){
    const salted = email + password;
    return await bcrypt.hash(salted, 10); // Hash the password with bcrypt
    }

async function validatePassword(email, password, hashedPassword){
    const salted = email + password;
    return await bcrypt.compare(salted, hashedPassword);
    }

async function checkCredentials(email, password){
    const query = `
        SELECT user_profile.token_id, userdata.password_hashed
        FROM userdata
        JOIN user_profile ON user_profile.id = userdata.user_id
        WHERE userdata.email = $1 AND userdata.deleted_at IS NULL
        `;
    try {
        const result = await db.query(query, [email]);
        if (!result.rows.length) return {success: false, err: "User not found."}; // User not found or deleted
        const { token_id, public_id, password_hashed } = result.rows[0];

        const isMatch = await validatePassword(email, password, password_hashed);
        if (!isMatch) return {success: false, err: "Password incorrect."}; // Passwords do not match
        return {success: true, token_id, public_id }; // Returns the id if credentials are valid        
        }
    catch (error) {
        console.error("Error executing query:", error.message);
        return {success: false, err: "Internal query failed."};
        }
    }

router.post("/login", upload.none(), async (req, res) => {
    const {email, password} = req.body ?? {}; // Destructure the request body

    if (!email || !password) {
        return res.status(400).json({ error: "Invalid Requests Headers. Email and Password should be provided." });
    } // make sure username and password are provided
    
    if (typeof email !== 'string' || typeof password !== 'string') {
        return res.status(400).json({ error: "Invalid input types. Data must be in string format" });
        } // Check if the input types are correct
        
    if (!emailValidator(email)) {
        return res.status(400).json({ error: "Invalid email format." });
        } // Validate the email format
    
    const uid = await checkCredentials(email, password); // Check credentials
    if (!uid.success) {
        return res.status(401).json({ error: "user might not exist or wrong password or got deleted." });
        } // Check if credentials are valid
    const { token_id } = uid;
    const token = generateJWT(token_id, process.env.USERS_SESSION_EXP);//jwt.sign({ userId: uid }, process.env.JWT_SECRET, { expiresIn: "1h" }); // Create a JWT token
    logger.info(`user: ${email} logged in.`); //logged login

    const fetchBasicData = `
        SELECT up.public_id, up.username, um.fname AS profile
        FROM user_profile up
        LEFT JOIN usermedia um ON up.id = um.user_id
        WHERE token_id = $1
        `;
    try { 
        const result = await db.query(fetchBasicData, [token_id]);
        return res.status(200).json({ message: "Login successful", token, user: result.rows[0] }); // Send the token back to the client
        }
    catch (error) { logger.error(`Error executing query: ${error.message}`, { stack: error.stack }); }

    });

router.post("/register", upload.none(), async (req, res) => {
    const { password, email } = req.body ?? {}; 
    let { username } = req.body ?? {};

    if (!usernameRegex.test(username)) {
        return res.status(400).json({ error: `Invalid username format. Input was: ${username}` });
        }

    if (!username || !password || !email) {
        return res.status(400).json({ error: "Incomplete credentials." });
        }
    if (typeof username !== 'string' || typeof password !== 'string' || typeof email !== 'string') {
        return res.status(400).json({ error: "Invalid input types." });
        } // Check if the input types are correct


    if (!emailValidator(email)) {
        return res.status(400).json({ error: "Invalid email format." });
        } // Validate the email format
    
    if (!usernameRegex.test(username)) {
        return res.status(400).json({ error: 'Invalid username format' });
        } // Validate the username format

    username = sanitizeInput(username); // XSS prevention

    const query = 'SELECT user_id FROM "userdata" WHERE email = $1';

    try { // check the username
        const result = await db.query(query, [email]);
        if (result.rows.length) return res.status(400).json({ error: "email already registered." });
    } catch (error){
        logger.error(`Error executing query: ${error.message}`, { stack: error.stack });
        return res.status(500).json({ error: "Database query failed" });
        }
    
    const hashedPassword = await hashPassword(email, password); // Hash the password

    const client = await db.connect();
    try {
        client.query('BEGIN'); // Start a transaction
        const insertData = 'INSERT INTO "userdata" (password_hashed, email) VALUES ($1, $2) RETURNING user_id';
        const result1 = await client.query(insertData, [hashedPassword, email]);
        const userId = result1.rows[0].user_id;
        
        const ProfilePath = process.env.DEFAULT_PROFILE_PATH;
        const ProfileDir = process.env.USER_PROFILE_DIR;
        const profile = await copyDefaultMediaDir(ProfilePath, ProfileDir); 

        const backgroundPath = process.env.DEFAULT_BACKGROUND_PATH;
        const backgroundDir = process.env.USER_BACKGROUND_DIR;
        const background = await copyDefaultMediaDir(backgroundPath, backgroundDir);

        const insertProf = 
            `INSERT INTO "user_profile" (id, username) VALUES ($1, $2)
             RETURNING token_id, public_id`;

        const result2 = await client.query(insertProf, [userId, username]);
        
        const insertMedia = `
            INSERT INTO "usermedia" (user_id, type, fname)
            VALUES ($1, $2, $3), ($1, $4, $5)
            `;
        await client.query(insertMedia, [userId, 'profile', profile, 'background', background]);
        ({ token_id: profileId, public_id } = result2.rows[0]);

        
        const token = generateJWT(profileId, process.env.USERS_SESSION_EXP);//jwt.sign({ userId: profileId }, process.env.JWT_SECRET, { expiresIn: "1h" }); // Create a JWT token
        logger.info(`user: ${email} registered.`); // Print the username to the console

        const user = {public_id, username, profile};
        client.query('COMMIT'); // Commit the transaction
        return res.status(200).json({ message: "Registered successful", token, user }); // Send the token back to the client    
    } catch (error) {
        client.query('ROLLBACK'); // Rollback the transaction in case of error
        logger.error(`Error executing query: ${error.message}`, { stack: error.stack });
        return res.status(500).json({ error: "Database query failed" });  // Send response to client
    } finally {
        client.release(); // Release the client back to the pool
        }

}); // make sure username and password are provided
    
router.delete("/delete", verifyToken, upload.none(), async (req, res) => {
    const { password } = req.body ?? {};
    if (!password || typeof password !== 'string' || password === "")
        return res.status(400).json({ error: "Password are Required." });

    const userId = req.user.id;
    const searchquery = `SELECT password_hashed, email FROM userdata WHERE user_id = $1 AND deleted_at IS NULL`;
    
    let result;
    try { result = await db.query(searchquery, [userId]); }
    catch (err) {
        logger.error(`Error executing search query: ${err.message}`, { stack: err.stack });
        return res.status(500).json({ error: "Database query failed" });
        }

    if (!result.rows.length)
        return res.status(400).json({ error: "User are nonexistant or got deleted." });

    const udata = result.rows[0];
    if (udata.password_hashed !== await hashPassword(udata.email, password))
        return res.status(400).json({ error: "Wrong password provided." });

    let ret;
    try {
        ret = await db.query(`UPDATE userdata SET deleted_at = NOW() WHERE user_id = $1 RETURNING deleted_at;`, [userId]);

        logger.info(`User with user_id ${userId} deleted at ${ret.rows[0].deleted_at}`);
        return res.status(200).json({ message: `Successfully deleted at ${ret.deleted_at}` });
        } catch (err) { 
            logger.error(`Error deleting user with user_id ${userId}: ${err.message}`, { stack: err.stack });
            return res.status(400).json({ error: "Database Error." });
            }
    });
module.exports = router;
