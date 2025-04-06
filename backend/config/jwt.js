const jwt = require('jsonwebtoken');
require('dotenv').config({ path: '../.env' }); // Go up 2 levels to load .env

// Secret key for signing (store this securely, ideally in an environment variable)
const secretKey = process.env.JWT_SECRET;

// Function to generate a session token
function generateToken(payload) {
    const token = jwt.sign(payload, secretKey, {
        expiresIn: '1h'  // Token expiration time (optional)
    });
    return token;
}

// Function to verify the session token and handle errors
function verifyToken(token) {
    try {
        const decoded = jwt.verify(token, secretKey);
        return { success: true, decoded };  // If token is valid, return decoded data
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return { success: false, message: 'Token expired' };
        }  else {
            return { success: false, message: 'Token verification failed' };
        }
    }
}

// Export functions to make them accessible in other files
module.exports = {
    generateToken,
    verifyToken
};
