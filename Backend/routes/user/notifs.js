const express = require('express');
const db = require("../../config/db");

const { verifyToken } = require('../../config/jwt'); // Import JWT verification middleware
const logger = require('../../config/logger'); // Logger for error handling
const router = express.Router();

router.get('/notifications/unread-count', verifyToken, async (req, res) => {
    const userId = req.user.id; // assuming auth middleware sets req.user

    try {
        const { rows } = await db.query(
            `SELECT COUNT(*) AS unread_count
             FROM user_notification_status
             WHERE user_id = $1 AND is_read = false`,
            [userId]
        );

        const count = parseInt(rows[0].unread_count, 10);
        res.json({ unread_count: count });
    } catch (err) {
        logger.error('Error fetching unread notification count:', err);
        res.status(500).json({ error: 'Failed to fetch unread notifications.' });
    }
});
