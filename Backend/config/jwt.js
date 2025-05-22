
require("dotenv").config({ path: "../.env.sensitive" });
const jwt = require('jsonwebtoken');

const db = require("./db");

const logger = require("./logger");  // Importing the logger

const crypto = require('crypto');  // For generating random strings

const JWT_SECRET = process.env.JWT_SECRET;  // Change to something very secure!


// Function to generate a strong random string for added randomness in the token
const generateRandomString = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');  // Generates a secure random string
};

// Middleware to generate JWT with UUID for uniqueness and dynamic expiration

const generateJWT = (load, expiresIn = '3h') => {
//  const uuid = generateUUID();  // Add UUID to the payload for added uniqueness
  const randomString = generateRandomString();  // Add a random string to make the token more unpredictable
  
  const payload = {
    //uuid,  // Add the UUID to the payload for added uniqueness
    jti: randomString,  // Add a random string as JWT ID for more entropy
    payload: load,  // Only the user_id in the payload
    iat: Math.floor(Date.now() / 1000)  // Issued at time (current timestamp)
  };

  // Sign the token with the payload and secret key, allowing dynamic expiration
  const token = jwt.sign(payload, JWT_SECRET, {expiresIn} );

  return token;
};


const verifyToken = async (req, res, next) => {
    const token = req.headers['authorization'];  // Assuming token is passed in the 'Authorization' header
  
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });  // If no token is found, return 401
    }
  
    // Remove the "Bearer " prefix if it's included
    const tokenWithoutBearer = token.startsWith('Bearer ') ? token.slice(7) : token;
  
    try {
      // Verify the token using the secret key
      const token_id = jwt.verify(tokenWithoutBearer, JWT_SECRET);
      const decoded = await db.query(`SELECT id FROM user_profile WHERE token_id = $1 AND 
          is_deleted = false LIMIT 1`, [token_id.payload]);
      if (!decoded.rows.length)
        return res.status(403).json({ message: 'User not found or got deleted.' });  // Data not found or got deleted

      req.user = decoded.rows[0];  // Store the decoded token (user data) in the request for later use
      next();  // Proceed to the next middleware/handler
    } catch (err) {
      logger.error('Token verification failed:', err);  // Log the error for debugging
      return res.status(401).json({ message: 'Invalid or expired session token' });  // If token is invalid or expired, return 401
    }
  };



const justifyToken = async (req, res, next) => {
    const token = req.headers['authorization'];

    if (!token) {
        req.user = undefined;
        return next();
    }

    const tokenWithoutBearer = token.startsWith('Bearer ') ? token.slice(7) : token;

    try {
        const token_id = jwt.verify(tokenWithoutBearer, JWT_SECRET);
        const decoded = await db.query(
            `SELECT id FROM user_profile WHERE token_id = $1 AND is_deleted = false LIMIT 1`,
            [token_id.payload]
        );

        if (!decoded.rows.length) {
            return res.status(403).json({ message: 'User not found or got deleted.' });
        }

        req.user = decoded.rows[0];  // Just { id: ... }
        next();
    } catch (err) {
        logger.error('Token verification failed:', err);
        req.user = undefined; // <-- IMPORTANT! still proceed without token
        return next();
    }
  };


const socketAuth = async (socket, next) => {
    try {
        // Extract the token from the socket handshake (auth object)
        const token = socket.handshake.auth.token;
        // If no token is provided, return an error
         logger.info('Socket token:', token);  // Log the token for debugging
        if (!token) {
            return next(new Error('No token provided'));
        }

        // Remove the "Bearer " prefix if it's included
        const tokenWithoutBearer = token.startsWith('Bearer ') ? token.slice(7) : token;

        // Verify the token using the secret key
        const token_id = jwt.verify(tokenWithoutBearer, JWT_SECRET);

        const decoded = await db.query(`
            SELECT id FROM user_profile 
            WHERE token_id = $1 AND is_deleted = false 
            LIMIT 1
        `, [token_id.payload]);

        if (!decoded.rows.length) {
            return next(new Error('User not found or got deleted.'));
        }

        // Store the decoded token (user data) in the socket object for later use
        socket.user = decoded.rows[0];
        next();  // Allow the connection to proceed
    } catch (err) {
        logger.error('Token verification failed:', err);  // Log the error for debugging
        next(new Error('Invalid or expired session token'));
        }
  };

// Export the functions for use in other parts of the app
module.exports = {
  generateJWT,
  verifyToken,
  justifyToken,
  socketAuth
};


