const express = require('express');
const db = require("../../config/db");

const { sendNotificationToUsers, getBitByName } = require('../../config/socket/notification');

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

    const client = await db.connect();
    try {
        client.query('BEGIN'); // Start a transaction

        const insertQuery = `
            INSERT INTO followers (following_user_id, follower_user_id)
            VALUES ($1, $2)
            ON CONFLICT (following_user_id, follower_user_id) DO NOTHING
            RETURNING *`;
        const { rows } = await client.query(insertQuery, [following_id, follower_id]);
        
        let msg;
        if (rows.length){
            await followNotifHandler(client, follower_id, following_id); // Call the notification handler
            logger.info(`User with ID ${follower_id} followed user with ID ${following_id}`);
            msg = "Follow successful."
            }
        else {
            logger.info(`User with ID ${follower_id} tried to follow user ${following_id}, but they are already following.`);
            msg = "Followed already";
            }

        client.query('COMMIT'); // Commit the transaction if successful
        return res.status(200).json({ message: msg });
    } catch (err) {
        client.query('ROLLBACK'); // Rollback the transaction on error
        logger.error(`Error executing follow query: ${err.stack}`);
        return res.status(500).json({ error: "Database error." });
        }
    finally { client.release(); }
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
        SELECT 
            u.public_id, 
            u.username, 
            um.fname AS picture
        FROM followers f
        INNER JOIN user_profile u ON u.id = f.follower_user_id
        LEFT JOIN usermedia um ON um.user_id = u.id AND um.type = 'profile'
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
        SELECT 
            u.username, 
            u.public_id, 
            um.fname AS picture
        FROM followers f
        INNER JOIN user_profile u ON u.id = f.following_user_id
        LEFT JOIN usermedia um ON um.user_id = u.id AND um.type = 'profile'
        WHERE f.follower_user_id = $1
        LIMIT $2 OFFSET  $3
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


const followNotifHandler = async (client, follower_id, following_id) => {
    try {
        // Get the username and public_id of the follower
        const userRes = await client.query(`
            SELECT username, public_id 
            FROM user_profile 
            WHERE id = $1
        `, [follower_id]);

        if (userRes.rowCount === 0) {
            logger.error(`User with ID ${follower_id} not found in user_profile table.`);
            return;
        }

        const { username, public_id } = userRes.rows[0];

        // Check if it's a mutual follow
        const mutualRes = await client.query(`
            SELECT 1 
            FROM followers 
            WHERE following_user_id = $1 AND follower_user_id = $2
        `, [follower_id, following_id]);

        let notifBit = getBitByName('follow'); // Default to FOLLOW bit
        if (mutualRes.rowCount > 0) {
            // Both follow each other, set the MUTUAL bit
            notifBit = getBitByName('mutual_follow');
        }

        // Prepare data for the notification
        const data = { username, ref: public_id };

        // Send the notification to the follower
        await sendNotificationToUsers([following_id], notifBit, data, client);

        logger.info(`Notification sent to user ${follower_id} regarding follow action.`);
    } catch (err) {
        logger.error(`Error during follow notification handling: ${err.stack}`);
    }
};



/*
const followNotifHandler = async (client, follower_id, following_id) => {
    try {
        // Insert the follow relationship, avoiding duplicates
        const insertQuery = `
            INSERT INTO followers (following_user_id, follower_user_id)
            VALUES ($1, $2)
            ON CONFLICT (following_user_id, follower_user_id) DO NOTHING
            RETURNING *`;
        
        const { rows } = await client.query(insertQuery, [following_id, follower_id]);
        
        if (rows.length) {
            // New follow relationship created, now check if it's mutual
            const mutualRes = await client.query(`
                SELECT 1 
                FROM followers 
                WHERE following_user_id = $1 AND follower_user_id = $2
            `, [follower_id, following_id]);

            let notifBit = '00000001'; // Default to FOLLOW bit
            if (mutualRes.rowCount > 0) {
                // Both follow each other, set the MUTUAL bit
                notifBit = '00000010';
            }

            // Insert the notification for the follower
            const notifId = await insertNotification(follower_id, notifBit, { following_user_id: following_id }, client);
            if (!notifId) {
                logger.error("Failed to insert notification into the database.");
                return;
                }
            else logger.info(`Notification ID ${notifId} inserted for user ${follower_id}`);
        }
    } catch (err) {
        logger.error(`Error during follow notification handling: ${err.stack}`);
    }
};

*/

module.exports = router;
