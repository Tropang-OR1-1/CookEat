require("dotenv").config({ path: "../.env" });

const validator = require("validator"); // Import the validator library for email validation
const db = require("../config/db");
const express = require("express"); // Initialize Express app
const app = express(); 

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
app.use(express.json());


async function testConnection() {
    try {
        const connection = await db.getConnection(); // Get a connection from the pool
        await connection.ping(); // Ping the database
        console.log("✅ Connected to the database!");
        connection.release(); // Release the connection back to the pool
    } catch (error) {
        console.error("❌ Database connection failed:", error.message);
    }
}

async function hashPassword(username, password){
    salted = username + password;
    return password;//await bcrypt.hash(salted, 10); // Hash the password with bcrypt
    }

async function checkCredentials(email, password){
    hashedPassword = await hashPassword(email, password); // Hash the password
    query = "SELECT user_id FROM UserData WHERE email = ? AND password_hashed = ?";
    try {
        const [rows, fields] = await db.execute(query, [email, hashedPassword]);
        if (!rows.length) return false;
        console.log("Rows:", rows); // Print the rows to the console
        return rows[0]; // Returns the id if credentials are valid        
        }
    catch (error) {
        console.error("Error executing query:", error.message);
        return res.status(500).json({ error: "Database query failed" });
        }
    }

app.post("/login", async (req, res) => {
    if (!req.body.hasOwnProperty("email") || !req.body.hasOwnProperty("password")) {
        return res.status(400).json({ error: "Invalid Requests Headers." });
    } // make sure username and password are provided
    const { email, password} = req.body; // Destructure the request body
    
    console.log("Email:", email); // Print the username to the console
    console.log("Password:", password); // Print the password to the console
    uid = await checkCredentials(email, password); // Check credentials
    console.log("User ID:", uid); // Print the user ID to the console
    if (!uid) {
        return res.status(401).json({ error: "user might not exist or wrong password." });
        } // Check if credentials are valid
    
    const token = jwt.sign({ userId: uid }, process.env.JWT_SECRET, { expiresIn: "1h" }); // Create a JWT token
    res.json({ message: "Login successful", token }); // Send the token back to the client
    
    
    //console.log("Received login request:", { username, password });
    });


    app.post("/register", async (req, res) => {
    if (!req.body.hasOwnProperty("username") || !req.body.hasOwnProperty("password") ||
        !req.body.hasOwnProperty("email"))
        return res.status(400).json({ error: "Incomplete credentials." });
    
    if (!validator.isEmail(req.body.email)) {
        return res.status(400).json({ error: "Invalid email format." });
        } // Validate the email format

    const { username, password, email } = req.body; 
    query = "SELECT user_id FROM userdata WHERE email = ?";

    try { // check the username
        [rows, fields] = await db.execute(query, [email]);
        if (rows.length) return res.status(400).json({ error: "email already registered." });
    } catch{
        console.error("Error executing query:", error.message);
        return res.status(500).json({ error: "Database query failed" });
        }
    
    hashedPassword = await hashPassword(username, password); // Hash the password

    let profileId = null;
    try {
        const insertData = "INSERT INTO userdata (password_hashed, email) VALUES (?, ?)";
        [rows, fields] = await db.execute(insertData, [hashedPassword, email]);
        const userId = rows.insertId;

        const insertProf = "INSERT INTO user_profile (id, username) VALUES (?, ?)";
        [rows, fields] = await db.execute(insertProf, [userId, username]);
        profileId = rows.insertId;
    } catch (error){ 
        console.error("Error executing query:", error.message);
        }; 
    
    const token = jwt.sign({ userId: profileId }, process.env.JWT_SECRET, { expiresIn: "1h" }); // Create a JWT token
    res.json({ message: "Registered successful", token }); // Send the token back to the client
    
    
    }); // make sure username and password are provided
    

app.listen(process.env.LOGIN_API_PORT, () => {
    console.log("Server is running on port 3000");
});
//UserSearch("johndb"); // Test the function with a sample username