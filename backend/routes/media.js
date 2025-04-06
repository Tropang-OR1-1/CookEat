// imageRoute.js
require("dotenv").config({ path: "../.env" });
const jwtModule = require('../config/jwt'); // Import JWT verification middleware
const path = require('path');
const express = require('express');
const router = express.Router();

// Secret key for signing JWT
const JWT_SECRET = process.env.JWT_SECRET;

// Middleware for token verification and image serving
router.get('/image/:token', (req, res) => {
    const token = req.params.token;

    if (!token) {
        return res.status(400).json({ error: 'No token provided' });
        }
    resulttoken = jwtModule.verifyToken(token); // Verify the session token
    if (!resulttoken.success) { // Check if the token is valid
        return res.status(401).json("Token invalid or expired.");
        }


    console.log({ message: resulttoken.decoded.userId });

    const imageName = resulttoken.decoded.userId; // e.g. "profile123.jpg"
    if (!imageName || typeof imageName !== 'string') {
        return res.status(400).json({ error: 'Invalid image filename in token' });
    }

    const uploadDir = process.env.PROFILE_DIR;
    const filePath = path.join(__dirname, '..', uploadDir, imageName);

    res.sendFile(filePath, (err) => {
        if (err) {
        return res.status(500).json({ error: 'Failed to send the file' });
        }
    });
});

module.exports = router;
