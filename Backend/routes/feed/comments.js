const express = require('express');
const db = require("../../config/db");

const { 
        queryPPID, queryCPID,
        isMutualFollow, sanitizeInput,
        isValidUUID, getPaginationParams
        } = require('../../config/defines');

const logger = require('../../config/logger'); // Import the logger
const upload = require('../../config/multer');  // Import multer configuration
const { verifyToken } = require('../../config/jwt'); // Import JWT verification middleware
const { sendNotificationToUsers, getBitByName } = require('../../config/socket/notification');

const router = express.Router();


router.post('/:post_id',verifyToken, upload.none(), async (req, res) => {
    const post_id  = req.params.post_id;
    const { content } = req.body ?? {};
    const userId =  req.user.id; // Get the user ID from the token 
    let comments = content;

    if (!comments){ return res.status(400).json({ error: "comments is empty." }); }
    if (typeof comments !== 'string')
        return res.status(400).json({error : "comments must be strings."});

    if (!isValidUUID(post_id))
        return res.status(400).json({ error: "post_id must be a valid UUID(s)."});
    
    comments = sanitizeInput(comments); // prevent XSS

    let pid = await queryPPID(post_id);
    if (!pid.success) return res.status(400).json({ error: pid.error });
    else pid = pid.id;

    const isallowed = await AllowedToViewPost(userId, pid);

    if (isallowed.fail){ 
        logger.error(`Authorization failed for user ${userId} on post ${pid}: ${JSON.stringify(isallowed)}`);
        return res.status(500).json({ error: 'Authorization checking fail.' });
        }
    if (!isallowed.allow){
        logger.warn(`Unauthorized access attempt by user ${userId} to comment on post ${pid}`);
        return res.status(400).json({ error: 'Unauthorized to comment.' });
        }
    
    const client = await db.connect();
    try  {
        await client.query('BEGIN;');
        const querycomment = `INSERT INTO comments (post_id, user_id, comments) VALUES ($1, $2, $3)
            RETURNING public_id, comments, created_at`;
        const {rows} = await client.query(querycomment, [pid, userId, comments]);
        const comment = rows[0];

        await commentNotifHandler(client, userId, post_id, comment.comments, comment.public_id);
        await client.query('COMMIT;');
        return res.status(200).json({msg: "Comment created successfully.", comment});
        } catch (err) {
            await client.query('ROLLBACK;');
            logger.error(`Comment insertion error for user ${userId} on post ${pid}: ${err.message}`);
            return res.status(500).json({error: "Comment Insertion Error."})
        } finally {
            client.release();
        }
    });

router.post('/:post_id/reply/:comment_id',verifyToken, upload.none(), async (req, res) => {
    const { post_id, comment_id }  = req.params;
    let { content } = req.body ?? {};
    const userId =  req.user.id; // Get the user ID from the token   
    let comments = content;
    
    
    if (!comments){ return res.status(400).json({ error: "comments is empty." }); }
    if (typeof comments !== 'string')
        return res.status(400).json({error : "comments must be strings."});

    if (!isValidUUID(post_id) || !isValidUUID(comment_id))
        return res.status(400).json({ error: "post_id and comment_id must be a valid UUID(s)."});
    
    comments = sanitizeInput(comments); // prevent XSS

    let pid = await queryPPID(post_id);
    if (!pid.success) return res.status(400).json({ error: pid.error });
    else pid = pid.id;

    let cid = await queryCPID(comment_id);
    if (!cid.success) return res.status(400).json({ error: cid.error });
    else cid = cid.id;

    const validation = await validateCommentIntegrity(pid, cid);
    if (!validation.valid)
        { return res.status(400).json({ error: 'Invalid comment/post relation.' }); }

    const isallowed = await AllowedToViewPost(userId, pid);
    if (isallowed.fail){ 
        logger.error(`Authorization failed for user ${userId} on post ${pid}: ${JSON.stringify(isallowed)}`);
        return res.status(400).json({ error: 'Authorization checking fail.' });
        }
    else if (!isallowed.allow){
        logger.warn(`Unauthorized access attempt by user ${userId} to comment on post ${pid}`);
        return res.status(400).json({ error: 'Not allowed to comment.' });
        }

    const client = await db.connect();
    try  {
        await client.query('BEGIN;');

        const querycomment = 
                `INSERT INTO comments (post_id, user_id, ref_id, comments) 
                 VALUES ($1, $2, $3, $4) RETURNING public_id, comments, created_at`;
        const commentResult = await client.query(querycomment, [pid, userId, cid, comments]);
        const comment = commentResult.rows[0];

        await commentNotifHandler(client, userId, post_id, comment.comments, comment.public_id);

        await client.query('COMMIT;');
        return res.status(200).json({msg: "Comment created successfully.", comment });
        } catch (err) {
            await client.query('ROLLBACK;');
            logger.error(`Comment insertion error for user ${userId} on post ${pid}: ${err.message}`);
            return res.status(500).json({error: "Comment Insertion Error."});
        } finally {
            client.release();
        }
    });


router.put('/:comment_id', verifyToken, upload.none(), async (req, res) => {
    const comment_id = req.params.comment_id;
    const userId =  req.user.id;
    let { content } = req.body ?? {};
    let comments = content;

    // Check required fields
    if (!comments) {
        return res.status(400).json({ error: "comments are required." });
    }

    // Validate types
    if (typeof comments !== 'string') {
        return res.status(400).json({ error: "comments must be a string." });
    }

    // Validate UUID
    if (!isValidUUID(comment_id)) {
        return res.status(400).json({ error: "Invalid UUID for comment_id." });
    }

    // Sanitize comment
    comments = sanitizeInput(comments);

    try {
        // Check if comment exists, not soft-deleted, and owned by user
        const commentCheckQuery = `SELECT id, user_id FROM comments WHERE public_id = $1 AND deleted_at IS NULL`;
        const commentCheck = await db.query(commentCheckQuery, [comment_id]);

        if (commentCheck.rowCount === 0) {
            return res.status(404).json({ error: "Comment not found or already deleted." });
        }

        const comment = commentCheck.rows[0];

        if (comment.user_id !== userId) {
            return res.status(403).json({ error: "Unauthorized to update this comment." });
        }

        // Perform the update
        const updateQuery = `UPDATE comments
            SET comments = $1, updated_at = NOW()
            WHERE id = $2 AND deleted_at IS NULL 
            RETURNING public_id, comments, created_at
            `;
        const result = await db.query(updateQuery, [comments, comment.id]);

        return res.status(200).json(result.rows[0]); // Return the updated comment details
    } catch (err) {
        logger.error(`Error updating comment for user ${userId}: ${err.message}`);
        return res.status(500).json({ error: "Error updating comment." });
    }
});


router.delete('/:comment_id', verifyToken, upload.none(), async (req, res) => {
    const comment_id = req.params.comment_id;
    const userId =  req.user.id; // Get the user ID from the token

    if (!comment_id) {
        return res.status(400).json({ error: "comment_id is required." });
    }

    if (typeof comment_id !== 'string') {
        return res.status(400).json({ error: "Invalid data type (comment_id must be a string)." });
    }

    if (!isValidUUID(comment_id)) { // Validate UUID format
        return res.status(400).json({ error: "Invalid UUID provided for comment_id." });
    }

    try {
        // Check if the comment exists and hasn't been soft-deleted
        const commentQuery = `SELECT user_id FROM comments WHERE public_id = $1 AND deleted_at IS NULL`;
        const commentResult = await db.query(commentQuery, [comment_id]);

        if (commentResult.rows.length === 0) {
            return res.status(404).json({ error: "Comment not found or already deleted." });
        }

        const comment = commentResult.rows[0];

        // Only allow soft delete if the user is the one who posted the comment
        if (comment.user_id !== userId) {
            return res.status(403).json({ error: "You are not authorized to delete this comment." });
        }

        // Perform the soft delete (update `deleted_at` column with current timestamp)
        const deleteQuery = `UPDATE comments SET deleted_at = NOW() WHERE public_id = $1`;
        await db.query(deleteQuery, [comment_id]);

        return res.status(200).json({ message: "Comment successfully soft deleted." });

    } catch (err) {
        logger.error(`Error deleting comment for user ${userId}: ${err.message}`);
        return res.status(500).json({ error: "Error deleting comment." });
    }
});


router.get('/:post_id', verifyToken, async (req, res) => {
    const { post_id } = req.params;
    const { replies } = req.query;
    const user_id = req.user.id;

    // Fetch the post's public_id
    let pid = await queryPPID(post_id);
    if (!pid.success) return res.status(400).json({ error: pid.error });
    pid = pid.id;

    let reply_id = undefined;
    if (replies !== undefined) {
        const replyCheck = await queryCPID(replies);
        if (!replyCheck.success) {
            return res.status(400).json({ error: replyCheck.error });
        }
        reply_id = replyCheck.id;
    }

    const defaultLimit = parseInt(process.env.DEFAULT_LIMIT) || 10;
    const { page, limit, offset } = getPaginationParams(req.query, defaultLimit);

    const client = await db.connect();
    try {
        let i = 1;

        const reactionSubquery = `SELECT 
            comment_id, 
            jsonb_concat(jsonb_object_agg(vote, count), jsonb_build_object('total', COALESCE(SUM(count), 0))) AS reactions
        FROM (
            SELECT comment_id, vote, COUNT(*) AS count
            FROM comment_reaction
            GROUP BY comment_id, vote
        ) AS votes_per_comment
        GROUP BY comment_id`;

        const query1 = `SELECT 
            comments.public_id AS comment_id,
            ref_comments.public_id AS replied_id,
            comments.comments AS comment_text,
            comments.created_at AS comment_created_at,
            user_profile.username AS user_name,
            user_profile.picture AS user_picture,
            user_profile.public_id AS user_public_id,
            (SELECT COUNT(*) FROM comments AS c2 WHERE c2.ref_id = comments.id AND c2.deleted_at IS NULL) AS reply_count,
            COALESCE(rs.reactions::jsonb, jsonb_build_object('total', 0)) AS reactions,
            (
                SELECT ur.vote FROM comment_reaction AS ur
                WHERE ur.comment_id = comments.id AND ur.user_id = $${i++}
                LIMIT 1
            ) AS user_reacted
        FROM comments
        JOIN user_profile ON comments.user_id = user_profile.id
        LEFT JOIN comments AS ref_comments ON comments.ref_id = ref_comments.id
        LEFT JOIN (${reactionSubquery}) AS rs ON rs.comment_id = comments.id `;

        let query2 = `WHERE comments.post_id = $${i++} AND comments.deleted_at IS NULL `;
        if (reply_id) {
            query2 += `AND comments.ref_id = $${i++} `;
        }
        const query3 = `GROUP BY comments.id, ref_comments.public_id, user_profile.username, user_profile.picture, user_profile.public_id, rs.reactions
                       ORDER BY comments.created_at DESC LIMIT $${i++} OFFSET $${i++}`;
        const values = reply_id ? [user_id, pid, reply_id, limit, offset] : [user_id, pid, limit, offset];

        const result = await client.query(query1 + query2 + query3, values);

        const countQuery = reply_id ?
            'SELECT COUNT(*) FROM comments WHERE post_id = $1 AND ref_id = $2 AND deleted_at IS NULL' :
            'SELECT COUNT(*) FROM comments WHERE post_id = $1 AND deleted_at IS NULL';
        const countResult = await client.query(countQuery, reply_id ? [pid, reply_id] : [pid]);

        const totalRecords = parseInt(countResult.rows[0].count);
        const totalPages = Math.ceil(totalRecords / limit);

        return res.status(200).json({
            data: result.rows,
            page,
            limit,
            totalPages,
            totalRecords
        });
    } catch (error) {
        logger.error(`Error retrieving comments for post ${pid}: ${error.message}`);
        return res.status(500).json({ error: 'Error retrieving comments for the post.' });
    } finally {
        client.release();
    }
});



const commentNotifHandler = async (client, userId, postId, comment, commentId) => {
    try {
        // Fetch the username of the commenter
        const userRes = await client.query(`
            SELECT username 
            FROM user_profile 
            WHERE id = $1
        `, [userId]);

        if (userRes.rowCount === 0) {
            logger.error(`User with ID ${userId} not found in user_profile table.`);
            return;
        }

        const { username } = userRes.rows[0];

        // Fetch the post owner's user ID using the posts.user_id reference to user_profile
        const ownerRes = await client.query(`
            SELECT up.id AS owner_id 
            FROM posts p
            JOIN user_profile up ON p.user_id = up.id
            WHERE p.public_id = $1
        `, [postId]);

        if (ownerRes.rowCount === 0) {
            logger.error(`Owner of post ID ${postId} not found.`);
            return;
        }

        const ownerId = ownerRes.rows[0].owner_id;

        // Prepare notification data
        const data = { 
            username,
            comment,
            ref: { post_id: postId, comment_id: commentId }
        };

        const notif_bit = getBitByName('comment'); // Use the comment bit

        // Send the notification to the post owner
        await sendNotificationToUsers([ownerId], notif_bit, data, client);

        logger.info(`Comment notification sent to owner ${ownerId} about post ${postId}.`);
    } catch (err) {
        logger.error(`Error during comment notification handling: ${err.stack}`);
    }
};








const AllowedToViewPost = async (user_id, post_id) => {
  try {
    const postQuery = await db.query(`SELECT user_id, visibility FROM posts WHERE id = $1`, [post_id]);

    if (!postQuery.rows.length) { return { fail: true, error: "Post does not exist." }; }
    const { user_id: postOwner, visibility } = postQuery.rows[0];
    if (postOwner === user_id || visibility === 'public') { return { allow: true, fail: false }; }

    if (visibility === 'private') { return { allow: false, fail: false }; }
    const result = await isMutualFollow(user_id, postOwner);
    if (!result.success) { return { fail: true }; }
    return { fail: false, allow: result.isConnected };

  } catch (err) {
    // Optional: log to an error logger like Winston/Sentry
    logger.error(`Error checking post visibility for user ${user_id} on post ${post_id}: ${err.message}`);
    return { fail: true, error: "Unexpected error." };
    }
};


const validateCommentIntegrity = async (postId, commentId) => {
    try { // ensure it exists and belongs to the same post
        if (commentId) {
            const { rows } = await db.query(
            `SELECT id FROM comments WHERE post_id = $1  AND id = $2 AND deleted_at IS NULL`,
            [postId, commentId]
            );

        if (rows.length === 0) {
            return { valid: false, error: 'Invalid reply target or mismatched post.' };
            }
        }
        return { valid: true };
    } catch (err) {
        logger.error(`Error validating comment integrity for post ${postId} and comment ${commentId}: ${err.message}`);
        return { valid: false, error: 'Internal server error' };
    } 
};


module.exports = router;

/*
router.get('/:post_id', verifyToken, async (req, res) => {
    const { post_id } = req.params;
    const { replies } = req.query;

    // Query to get the public_id of the post (assuming queryPPID fetches post details by post_id)
    let pid = await queryPPID(post_id);
    if (!pid.success) return res.status(400).json({ error: pid.error });
    else pid = pid.id;

    let reply_id = undefined;
    if (replies !== undefined){
        const replyCheck = await queryCPID(replies);
        if (!replyCheck.success) {
            return res.status(400).json({ error: replyCheck.error });
            }
        reply_id = replyCheck.id;  // Assign the valid reply_id
        }

    const defaultLimit = parseInt(process.env.DEFAULT_LIMIT) || 10;
    const { page, limit, offset } = getPaginationParams(req.query, defaultLimit);

    const client = await db.connect();
    try {
        // Query to get comments for the given post_id with pagination
        let i = 1;
        const query1 = `SELECT 
            comments.public_id AS comment_id,
            ref_comments.public_id AS replied_id,  -- The comment this comment is replying to (if any)
            comments.comments AS comment_text,
            comments.created_at AS comment_created_at,
            user_profile.username AS user_name,
            user_profile.picture AS user_picture,
            user_profile.public_id AS user_public_id,
            (SELECT COUNT(*) FROM comments AS c2 WHERE c2.ref_id = comments.id AND c2.deleted_at IS NULL) AS reply_count
                FROM comments
                JOIN user_profile ON comments.user_id = user_profile.id
                LEFT JOIN comments AS ref_comments 
                ON comments.ref_id = ref_comments.id `;

        let query2 = `WHERE comments.post_id = $${i++} AND comments.deleted_at IS NULL `;
        query2 += reply_id ? ` AND comments.ref_id = $${i++} ` : ' ';
        const query3 = `ORDER BY comments.created_at DESC LIMIT $${i++} OFFSET $${i++}`;
        const values = reply_id ? [pid, reply_id, limit, offset] : [pid, limit, offset];

        const result = await client.query(query1 + query2 + query3, values);

        // Query to get the total count of comments for pagination info
        const countQuery = reply_id 
        ? 'SELECT COUNT(*) FROM comments WHERE post_id = $1 AND ref_id = $2 AND deleted_at IS NULL'
        : 'SELECT COUNT(*) FROM comments WHERE post_id = $1 AND deleted_at IS NULL';
        const countResult = await client.query(countQuery, reply_id ? [pid, reply_id] : [pid]);


        const totalRecords = parseInt(countResult.rows[0].count);
        const totalPages = Math.ceil(totalRecords / limit);

        // Return the paginated data
        return res.status(200).json({
            data: result.rows,
            page,
            limit,
            totalPages,
            totalRecords
        });
    } catch (error) {
        logger.error(`Error retrieving comments for post ${pid}: ${error.message}`);
        return res.status(500).json({ error: 'Error retrieving comments for the post.' });
    } finally {
        client.release();
    }
});
*/
