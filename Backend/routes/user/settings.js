const express = require('express');
const db = require("../../config/db");

const upload = require('../../config/multer');  // Import multer configuration
const { verifyToken } = require('../../config/jwt'); // Import JWT verification middleware

require('dotenv').config({ path: '../.env' });

const {NOTIF_TYPES} = require('../../config/socket/notification');

const router = express.Router();



router.get('/notification', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;

        // Fetch current notification bit for the user
        const result = await db.query(
            'SELECT notif_bit FROM user_profile WHERE id = $1',
            [userId]
        );
        
        // Get the current notif_bit or default to '00000000' if not found
        let currentNotifBit = result.rows[0]?.notif_bit || '00000000';

        // Convert the currentNotifBit to a readable format
        const notification = {};
        NOTIF_TYPES.forEach((type, index) => {
            const isActive = (parseInt(currentNotifBit, 2) & parseInt(type.bit, 2)) !== 0;
            notification[type.name] = isActive ? true : false;
        });

        res.json({
            success: true,
            notification,
        });
    } catch (err) {
        console.error(`Error fetching notification settings: ${err.stack}`);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
  });


router.post('/notification', verifyToken, upload.none(), async (req, res) => {
    try {
        const userId = req.user.id;
        // Parse the changes if it's a string
        const changes = typeof req.body.changes === 'string' ? JSON.parse(req.body.changes) : req.body.changes;

        if (!changes) return res.status(404).json({ err: "Change should be provided" });

        // Fetch current notification bit for the user
        const result = await db.query(
            'SELECT notif_bit FROM user_profile WHERE id = $1',
            [userId]
        );
        // Get the current notif_bit or default to '00000000' if not found
        let currentNotifBit = result.rows[0]?.notif_bit || '00000000';

        // Iterate through NOTIF_TYPES and apply changes
        NOTIF_TYPES.forEach((type) => {
            const value = changes[type.name];
            
            if (value === 'true' || value === true || value === '1' || value === 1) {
                // OR the current bit with the bit value from NOTIF_TYPES
                currentNotifBit = (parseInt(currentNotifBit, 2) | parseInt(type.bit, 2)).toString(2).padStart(8, '0');
            } else if (value === 'false' || value === false || value === '0' || value === 0) {
                // AND the current bit with the inverse of the bit value from NOTIF_TYPES
                currentNotifBit = (parseInt(currentNotifBit, 2) & ~parseInt(type.bit, 2)).toString(2).padStart(8, '0');
            }
        });
        // Ensure the 'admin_announcement' bit is always 1
        const adminIndex = NOTIF_TYPES.findIndex(type => type.name === 'admin_announcement');
        if (adminIndex !== -1) {
            currentNotifBit = (parseInt(currentNotifBit, 2) | parseInt(NOTIF_TYPES[adminIndex].bit, 2)).toString(2).padStart(8, '0');
        }

        // Update the database with the modified notif_bit
        await db.query(
            'UPDATE user_profile SET notif_bit = $1 WHERE id = $2',
            [currentNotifBit, userId]
        );

        res.json({ success: true, message: 'Notification settings updated successfully.' });
    } catch (err) {
        console.error(`Error updating notification settings: ${err.stack}`);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

module.exports = router;
