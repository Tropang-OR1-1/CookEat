require("dotenv").config({ path: "../.env" });
const express = require("express"); // Initialize Express app
const bcrypt = require('bcryptjs'); // Use 'bcrypt' if you installed bcrypt, 'bcryptjs' otherwise

const router = express.Router();
router.use(express.urlencoded({ extended: true }));  // To handle form-data bodies

//const app = express(); 
const cors = require("cors");

const db = require("../../config/db");
const upload = require("multer")();
const { usernameRegex, emailValidator, sanitizeInput } = require('../../config/defines');


const { generateJWT, verifyToken } = require('../../config/jwt'); // Import the module


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
    hashedPassword = await hashPassword(email, password); // Hash the password
    const query = `
        SELECT user_profile.token_id, userdata.password_hashed
        FROM userdata
        JOIN user_profile ON user_profile.id = userdata.user_id
        WHERE userdata.email = $1 AND userdata.deleted_at IS NULL
        `;
    try {
        const result = await db.query(query, [email]);
        if (!result.rows.length) return {success: false, err: "User not found."}; // User not found or deleted

        const isMatch = await validatePassword(email, password, result.rows[0].password_hashed);
        if (!isMatch) return {success: false, err: "Password incorrect."}; // Passwords do not match

        return {success: true, token_id: result.rows[0].token_id}; // Returns the id if credentials are valid        
        }
    catch (error) {
        console.error("Error executing query:", error.message);
        return {success: false, err: "Internal query failed."};
        }
    }

router.post("/login", upload.none(), async (req, res) => {
    const {email, password} = req.body; // Destructure the request body

    if (!email || !password) {
        return res.status(400).json({ error: "Invalid Requests Headers." });
    } // make sure username and password are provided
    
    if (typeof email !== 'string' || typeof password !== 'string') {
        return res.status(400).json({ error: "Invalid input types." });
        } // Check if the input types are correct
        
    if (!emailValidator(email)) {
        return res.status(400).json({ error: "Invalid email format." });
        } // Validate the email format
    
    console.log(email, password);
    uid = await checkCredentials(email, password); // Check credentials
    if (!uid.success) {
        return res.status(401).json({ error: "user might not exist or wrong password or got deleted." });
        } // Check if credentials are valid
    console.log(uid);

    const token = generateJWT(uid.token_id, process.env.USERS_SESSION_EXP);//jwt.sign({ userId: uid }, process.env.JWT_SECRET, { expiresIn: "1h" }); // Create a JWT token
    res.json({ message: "Login successful", token }); // Send the token back to the client
    console.log(`user: ${email} logged in.`); // Print the username to the console
    });

router.post("/register", upload.none(), async (req, res) => {
    const { password, email } = req.body ?? {}; 
    let { username } = req.body ?? {};

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

    query = 'SELECT user_id FROM "userdata" WHERE email = $1';

    try { // check the username
        const result = await db.query(query, [email]);
        if (result.rows.length) return res.status(400).json({ error: "email already registered." });
    } catch{
        console.error("Error executing query:", error.message);
        return res.status(500).json({ error: "Database query failed" });
        }
    
    hashedPassword = await hashPassword(email, password); // Hash the password

    let profileId;
    try {
        const insertData = 'INSERT INTO "userdata" (password_hashed, email) VALUES ($1, $2) RETURNING user_id';
        const result1 = await db.query(insertData, [hashedPassword, email]);
        
        const userId = result1.rows[0].user_id;
        
        const insertProf = 'INSERT INTO "user_profile" (id, username) VALUES ($1, $2) RETURNING token_id';
        const result2 = await db.query(insertProf, [userId, username]);
        
        profileId = result2.rows[0].token_id;
        console.log("inner:" + profileId);

    } catch (error){ 
        console.error("Error executing query:", error.message);
        }; 
    //console.log(profileId);

    const token = generateJWT(profileId, process.env.USERS_SESSION_EXP);//jwt.sign({ userId: profileId }, process.env.JWT_SECRET, { expiresIn: "1h" }); // Create a JWT token
    res.json({ message: "Registered successful", token }); // Send the token back to the client

    console.log(`user: ${email} registered.`); // Print the username to the console
    
    }); // make sure username and password are provided
    
router.delete("/delete", verifyToken, upload.none(), async (req, res) => {
    const { password } = req.body ?? {};
    if (!password || typeof password !== 'string' || password === "")
        return res.status(400).json({ error: "Password are Required." });

    const userId = req.user.id;
    const searchquery = `SELECT password_hashed, email FROM userdata WHERE user_id = $1 AND deleted_at IS NULL`;
    const result = await db.query(searchquery, [userId]);

    if (!result.rows.length)
        return res.status(400).json({ error: "User are nonexistant or got deleted." });

    const udata = result.rows[0];
    if (udata.password_hashed !== await hashPassword(udata.email, password))
        return res.status(400).json({ error: "Wrong password provided." });

    let ret;
    try {
        ret = await db.query(`UPDATE userdata SET deleted_at = NOW() WHERE user_id = $1 RETURNING deleted_at;`, [userId]);
        return res.status(200).json({ message: `Successfully deleted at ${ret.deleted_at}` });

        } catch (err) { return res.status(400).json({ error: "Database Error." }); }
    });
module.exports = router;