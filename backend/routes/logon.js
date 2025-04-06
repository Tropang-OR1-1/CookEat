require("dotenv").config({ path: "../.env" });
const express = require("express"); // Initialize Express app

const router = express.Router();
router.use(express.urlencoded({ extended: true }));  // To handle form-data bodies

//const app = express(); 
const cors = require("cors");

const validator = require("validator"); // Import the validator library for email validation
const db = require("../config/db");
const rateLimit = require("express-rate-limit");
const upload = require("multer")();


const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

router.use(cors()); // Enable CORS for all routes

  

const loginLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 requests per windowMs
    message: "Too many login attempts from this IP, please try again after 15 minutes",
  });

  

async function hashPassword(username, password){
    salted = username + password;
    return password;//await bcrypt.hash(salted, 10); // Hash the password with bcrypt
    }

async function checkCredentials(email, password){
    hashedPassword = await hashPassword(email, password); // Hash the password
    const query = 'SELECT user_id FROM "userdata" WHERE email = $1 AND password_hashed = $2';
    try {
        const result = await db.query(query, [email, hashedPassword]);
        if (!result.rows.length) return false;
        return result.rows[0]; // Returns the id if credentials are valid        
        }
    catch (error) {
        console.error("Error executing query:", error.message);
        return res.status(500).json({ error: "Database query failed" });
        }
    }

router.post("/login", upload.none(), loginLimiter, async (req, res) => {
    if (req.files && req.files.length > 0) {
        return res.status(400).json({ error: 'Files are not allowed in this request' });
      }

    const {email, password} = req.body; // Destructure the request body

    if (!email || !password) {
        return res.status(400).json({ error: "Invalid Requests Headers." });
    } // make sure username and password are provided
    
    if (typeof email !== 'string' || typeof password !== 'string') {
        return res.status(400).json({ error: "Invalid input types." });
        } // Check if the input types are correct
        
    if (!validator.isEmail(req.body.email)) {
        return res.status(400).json({ error: "Invalid email format." });
        } // Validate the email format
    

    uid = await checkCredentials(email, password); // Check credentials
    if (!uid) {
        return res.status(401).json({ error: "user might not exist or wrong password." });
        } // Check if credentials are valid
    
    const token = jwt.sign({ userId: uid }, process.env.JWT_SECRET, { expiresIn: "1h" }); // Create a JWT token
    res.json({ message: "Login successful", token }); // Send the token back to the client
    console.log(`user: ${email} logged in.`); // Print the username to the console
    });

router.post("/register", upload.none(), loginLimiter, async (req, res) => {
    console.log(req.body); // Log the request body for debugging
    const { username, password, email } = req.body; 

    if (!username || !password || !email) {
        return res.status(400).json({ error: "Incomplete credentials." });
        }
    if (typeof username !== 'string' || typeof password !== 'string' || typeof email !== 'string') {
        return res.status(400).json({ error: "Invalid input types." });
        } // Check if the input types are correct

    if (!validator.isEmail(req.body.email)) {
        return res.status(400).json({ error: "Invalid email format." });
        } // Validate the email format


    query = 'SELECT user_id FROM "userdata" WHERE email = $1';

    try { // check the username
        result = await db.query(query, [email]);
        if (result.rows.length) return res.status(400).json({ error: "email already registered." });
    } catch{
        console.error("Error executing query:", error.message);
        return res.status(500).json({ error: "Database query failed" });
        }
    
    hashedPassword = await hashPassword(username, password); // Hash the password

    let profileId = null;
    try {
        const insertData = 'INSERT INTO "userdata" (password_hashed, email) VALUES ($1, $2) RETURNING user_id';
        const result1 = await db.query(insertData, [hashedPassword, email]);
        
        const userId = result1.rows[0].user_id;
        
        const insertProf = 'INSERT INTO "user_profile" (id, username) VALUES ($1, $2) RETURNING id';
        const result2 = await db.query(insertProf, [userId, username]);
        
        const profileId = result2.rows[0].id;
    } catch (error){ 
        console.error("Error executing query:", error.message);
        }; 
    
    const token = jwt.sign({ userId: profileId }, process.env.JWT_SECRET, { expiresIn: "1h" }); // Create a JWT token
    res.json({ message: "Registered successful", token }); // Send the token back to the client

    console.log(`user: ${email} registered.`); // Print the username to the console
    
    }); // make sure username and password are provided
    

module.exports = router;