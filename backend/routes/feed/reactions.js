const express = require('express');
const db = require("../../config/db");
const {allowedReactions, isValidUUID, queryPPID, queryCPID } = require('../../config/defines');

const upload = require('../../config/multer');  // Import multer configuration
const { verifyToken } = require('../../config/jwt'); // Import JWT verification middleware

const router = express.Router();

router.post('/post',verifyToken, upload.none(), async (req, res) => {
    const { reaction, post_id } = req.body ?? {};

    if (!reaction || !post_id)
        return res.status(400).json({ error: "reaction and post_id is required." });

    if (typeof reaction !== 'string' || typeof post_id !== 'string')
        return res.status(400).json({ error: "data values must be string." });

    if (!isValidUUID(post_id))
        return res.status(400).json({ error: "post_id must be in uuid format." });

    if (!allowedReactions.includes(reaction))
        return res.status(400).json({ error: "must be a valid reaction." });

    let pid = await queryPPID(post_id);
    if (!pid.success) return res.status(400).json({ error: pid.error });
    pid = pid.id;

    const userId =  req.user.id; // Get the user ID from the token
    const query = `INSERT INTO post_reaction (user_id, post_id, vote)
            VALUES ($1, $2, $3)
            ON CONFLICT (user_id, post_id)
            DO UPDATE SET vote = EXCLUDED.vote;`;
    try { const result = await db.query(query, [userId, pid, reaction]); }
    catch (error) { return res.status(400).json({ error }) }

    return res.status(200).send(`Reaction(${post_id}): ${reaction}.`);
    });

router.post('/comment',verifyToken, async (req, res) => {
    const { reaction, comment_id } = req.body ?? {};

    if (!reaction || !comment_id)
        return res.status(400).json({ error: "reaction and comment_id is required." });

    if (typeof reaction !== 'string' || typeof comment_id !== 'string')
        return res.status(400).json({ error: "data values must be string." });

    if (!isValidUUID(comment_id))
        return res.status(400).json({ error: "comment_id must be in uuid format." });

    if (!allowedReactions.includes(reaction))
        return res.status(400).json({ error: "must be a valid reaction." });

    let pid = await queryCPID(comment_id);
    if (!pid.success) return res.status(400).json({ error: pid.error });
    pid = pid.id;

    const userId =  req.user.id; // Get the user ID from the token
    const query = `INSERT INTO comment_reaction (user_id, comment_id, vote)
            VALUES ($1, $2, $3)
            ON CONFLICT (user_id, comment_id)
            DO UPDATE SET vote = EXCLUDED.vote;`;
    try { const result = await db.query(query, [userId, pid, reaction]); }
    catch (error) { return res.status(400).json({ error }) }


    return res.status(200).send(`Reaction(${comment_id}): ${reaction}.`);
    });
module.exports = router;

