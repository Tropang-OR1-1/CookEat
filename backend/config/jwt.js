require("dotenv").config({ path: "../.env" });
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');  // Importing the uuid library
const crypto = require('crypto');  // For generating random strings

const JWT_SECRET = process.env.JWT_SECRET;  // Change to something very secure!

const generateUUID = () => {
  return uuidv4();  // Generates a random UUID
};

// Function to generate a strong random string for added randomness in the token
const generateRandomString = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');  // Generates a secure random string
};

// Middleware to generate JWT with UUID for uniqueness and dynamic expiration
const generateJWT = (load, expiresIn = '3h') => {
  const uuid = generateUUID();  // Add UUID to the payload for added uniqueness
  const randomString = generateRandomString();  // Add a random string to make the token more unpredictable
  
  const payload = {
    uuid,  // Add the UUID to the payload for added uniqueness
    jti: randomString,  // Add a random string as JWT ID for more entropy
    payload: load,  // Only the user_id in the payload
    iat: Math.floor(Date.now() / 1000)  // Issued at time (current timestamp)
  };

  // Sign the token with the payload and secret key, allowing dynamic expiration
  const token = jwt.sign(payload, JWT_SECRET, {expiresIn} );

  return token;
};


const verifyToken = (req, res, next) => {
    const token = req.headers['authorization'];  // Assuming token is passed in the 'Authorization' header
  
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });  // If no token is found, return 401
    }
  
    // Remove the "Bearer " prefix if it's included
    const tokenWithoutBearer = token.startsWith('Bearer ') ? token.slice(7) : token;
  
    try {
      // Verify the token using the secret key
      const decoded = jwt.verify(tokenWithoutBearer, JWT_SECRET);
      req.user = decoded;  // Store the decoded token (user data) in the request for later use
      next();  // Proceed to the next middleware/handler
    } catch (err) {
      return res.status(401).json({ message: 'Invalid or expired token' });  // If token is invalid or expired, return 401
    }
  };

const verifyMedia = (mediaToken) => { // check for args not on auth header
    try {
      const decoded = jwt.verify(mediaToken, JWT_SECRET);  // Verify the media token using the secret key
      return decoded;  // Return the decoded token (user data)
    } catch (err) {
      return null;  // If token is invalid or expired, return null
    }
  
}


function getUserToken(req) {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
  
    const token = authHeader.split(' ')[1];
  
    try {
      const decoded = jwt.verify(token, secretKey);
      return { user: decoded.payload.user_id };
    } catch (error) {
      return null;
    }
  }
  


// Export the functions for use in other parts of the app
module.exports = {
  generateJWT,
  verifyToken,
  verifyMedia,
  getUserToken
};




/*
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

require('dotenv').config({ path: '../.env' }); // Go up 2 levels to load .env

// Secret key for signing (store this securely, ideally in an environment variable)
const secretKey = process.env.JWT_SECRET;

// Function to generate a session token
function generateToken(payload) {
    //randomizer.data = payload; // Assign the payload to the randomizer object
    const token = jwt.sign(payload, secretKey, 
        {
        algorithm: 'HS256',
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
*/