const express = require('express');
const db = require("../../config/db");

const { 
        getPaginationParams,
        isValidUUID, canAccessUserData,
        queryUPID
        } = require('../../config/defines');

const logger = require('../../config/logger'); // Import the logger
const upload = require('../../config/multer');  // Import multer configuration
const { verifyToken } = require('../../config/jwt'); // Import JWT verification middleware

const router = express.Router();

router.post('/follow/:user_id', verifyToken, upload.none(), async (req, res) => {
    const publicId = req.params.user_id;
    const follower_id =  req.user.id; // From JWT

    if (!isValidUUID(publicId))
        return res.status(400).json({ error: "user_id must be a valid UUID." });

    // Await the queryUPID call
    const result = await queryUPID(publicId);
    if (!result.success)
        return res.status(400).json({ error: "Invalid following ID." });

    const following_id = result.user_id;

    if (following_id === follower_id)
        return res.status(400).json({ error: "Invalid cant follow to oneself." });

    try {
        const insertQuery = `
            INSERT INTO followers (following_user_id, follower_user_id)
            VALUES ($1, $2)
            ON CONFLICT (following_user_id, follower_user_id) DO NOTHING
            RETURNING *`;
        const { rows } = await db.query(insertQuery, [following_id, follower_id]);
        
        if (rows.length){
            logger.info(`User with ID ${follower_id} followed user with ID ${following_id}`);
            return res.status(200).json({ message: "Follow successful." });
            }
        else {
            logger.info(`User with ID ${follower_id} tried to follow user ${following_id}, but they are already following.`);
            return res.status(200).json({ message: "Followed already" });
        }
    } catch (err) {
        logger.error(`Error executing follow query: ${err.stack}`);
        return res.status(500).json({ error: "Database error." });
    }
});


router.post('/unfollow/:user_id', verifyToken, upload.none(), async (req, res) => {
    const publicId = req.params.user_id;
    const follower_id = req.user.id;

    if (!isValidUUID(publicId))
        return res.status(400).json({ error: "user_id must be a valid UUID." });

    const result = await queryUPID(publicId);
    if (!result.success)
        return res.status(400).json({ error: "Invalid following ID." });

    const following_id = result.user_id;

    if (following_id === follower_id)
        return res.status(400).json({ error: "Invalid cant unfollow to oneself." });
    try {
        const deleteQuery = `
            DELETE FROM followers
            WHERE following_user_id = $1 AND follower_user_id = $2;
        `;
        await db.query(deleteQuery, [following_id, follower_id]);
        logger.info(`User ${follower_id} unfollowed user ${following_id}`);
        return res.status(200).json({ message: "Unfollow successful." });
    } catch (err) {
        logger.error(`Error while unfollowing: ${err.stack}`);
        return res.status(500).json({ error: "Database error." });
        }
    });


router.get('/followers/:user_id', verifyToken, async (req, res) => {
    const publicId = req.params.user_id;

    if (!isValidUUID(publicId) || publicId === "me")
        return res.status(400).json({ error: "user_id must be a valid UUID." });
    
    let result = {};
    if (publicId === "me") {
        result.user_id = req.user.id;
    } else {
        result = await queryUPID(publicId);
        if (!result.success) {
            return res.status(400).json({ error: "Invalid user ID." });
        }
    }

    const userId = result.user_id;
    const accId = req.user.id; // Get the user ID from the token

    // Check if the current user has permission to access this user's data
    const checkStatus = await canAccessUserData(accId, userId);
    if (!checkStatus.success) {
        logger.error(`User ${accId} tried to access data of user ${userId} without permission.`);
        return res.status(403).json({ error: checkStatus.error });
    }

    // Pagination params
    const defaultLimit = parseInt(process.env.DEFAULT_LIMIT) || 10;
    const { page, limit, offset } = getPaginationParams(req.query, defaultLimit);

    try {
        const selectQuery = `
            SELECT u.public_id, u.username, u.picture
            FROM followers f
            INNER JOIN user_profile u ON u.id = f.follower_user_id
            WHERE f.following_user_id = $1
            LIMIT $2 OFFSET $3
        `;
        const { rows } = await db.query(selectQuery, [userId, limit, offset]);

        logger.info(`Successfully fetched ${rows.length} followers for user ${userId}`);

        return res.status(200).json({
            followers: rows,
            pagination: { page, limit, offset }
        });
    } catch (err) {
        logger.error(`Error fetching followers for user ${userId}: ${err.stack}`);
        return res.status(500).json({ error: "Database error." });
    }
});

router.get('/followings/:user_id', verifyToken, async (req, res) => {
    const publicId = req.params.user_id;

    // Check if user_id is a valid UUID or "me"
    if (!isValidUUID(publicId) && publicId !== "me") {
        return res.status(400).json({ error: "user_id must be a valid UUID or 'me'." });
    }
    
    let result = {};
    
    // If the user_id is "me", use the logged-in user's ID
    if (publicId === "me") {
        result.user_id = req.user.id;
    } else {
        result = await queryUPID(publicId);
        if (!result.success) {
            return res.status(400).json({ error: "Invalid user ID." });
        }
    }

    const userId = result.user_id;
    const accId = req.user.id; // Get the user ID from the token

    // Check if the current user has permission to access this user's data
    const checkStatus = await canAccessUserData(accId, userId);
    if (!checkStatus.success) {
        logger.error(`User ${accId} tried to access data of user ${userId} without permission.`);
        return res.status(403).json({ error: checkStatus.error });
    }

    // Pagination params
    const defaultLimit = parseInt(process.env.DEFAULT_LIMIT) || 10;
    const { page, limit, offset } = getPaginationParams(req.query, defaultLimit);

    try {
        const selectQuery = `
            SELECT u.username, u.public_id, u.picture
            FROM followers f
            INNER JOIN user_profile u ON u.id = f.follower_user_id
            WHERE f.following_user_id = $1
            LIMIT $2 OFFSET $3
        `;
        const { rows } = await db.query(selectQuery, [userId, limit, offset]);

        logger.info(`Successfully fetched ${rows.length} followings for user ${userId}`);

        // Return the followers and pagination info
        return res.status(200).json({
            followings: rows,
            pagination: { page, limit, offset }
        });
    } catch (err) {
        logger.error(`Error fetching followings for user ${userId}: ${err.stack}`);
        return res.status(500).json({ error: "Database error." });
    }
});




module.exports = router;
