const express = require('express');
const db = require("../../config/db");

const { 
        queryPPID, queryCPID,
        isMutualFollow, sanitizeInput,
        isValidUUID
        } = require('../../config/defines');

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
        
        if (rows.length) return res.status(200).json({ message: "Follow successful." });
        else return res.status(200).json({ message: "Followed already" });
    } catch (err) {
        console.log(err);
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
        return res.status(200).json({ message: "Unfollow successful." });
    } catch (err) {
        return res.status(500).json({ error: "Database error." });
        }
    });



const queryUPID = async (user_public_id) => { // query user public id
  try {
    const { rows } = await db.query("SELECT id FROM user_profile WHERE public_id = $1", [user_public_id]);
    return rows.length ? { success: true, user_id: rows[0].id } : { success: false, error: 'user not found' };
    } catch (err) {
      return { success: false, error: 'Database error' };
    }
}


module.exports = router;
