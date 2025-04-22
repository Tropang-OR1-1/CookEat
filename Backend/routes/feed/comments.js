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
    console.log( isallowed);
    if (isallowed.fail){ return res.status(500).json({ error: 'Authorization checking fail.' }); }
    if (!isallowed.allow){ return res.status(400).json({ error: 'Unauthorized to comment.' }); }

    try  {
        const querycomment = `INSERT INTO comments (post_id, user_id, comments) VALUES ($1, $2, $3) RETURNING public_id`;
        const commentResult = await db.query(querycomment, [pid, userId, comments]);
        return res.status(200).json({"CommentID": commentResult.rows[0].public_id });
        } catch (err) { return res.status(500).json({error: "Comment Insertion Error."})}
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
    if (isallowed.fail)
        { return res.status(400).json({ error: 'Authorization checking fail.' }); }
    else if (!isallowed.allow)
        { return res.status(400).json({ error: 'Not allowed to comment.' }); }

    try  {
        const querycomment = 
                `INSERT INTO comments (post_id, user_id, ref_id, comments) 
                 VALUES ($1, $2, $3, $4) RETURNING public_id`;
        const commentResult = await db.query(querycomment, [pid, userId, cid, comments]);
        return res.status(200).json({"CommentID": commentResult.rows[0].public_id });
        } catch (err) { return res.status(500).json({error: "Comment Insertion Error."})}
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
            WHERE id = $2
        `;
        await db.query(updateQuery, [comments, comment.id]);

        return res.status(200).json({ message: "Comment updated successfully." });
    } catch (err) {
        console.error("Update Error:", err);
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
        console.error("Error during soft delete:", err);
        return res.status(500).json({ error: "Error deleting comment." });
    }
});

router.get('/:post_id', async (req, res) => {
    const { post_id } = req.params;
    
    // Query to get the public_id of the post (assuming queryPPID fetches post details by post_id)
    let pid = await queryPPID(post_id);
    if (!pid.success) return res.status(400).json({ error: pid.error });
    else pid = pid.id;

    // Get page from query params, default to 1 if not provided
    const page = parseInt(req.query.page) || 1;

    // Get the page limit from environment variables, default to 10 if not provided
    const limit = parseInt(process.env.COMMENTS_PAGE_LIMIT) || 10;

    // Calculate the offset based on the page number
    const offset = (page - 1) * limit;

    const client = await db.connect();
    try {
        // Query to get comments for the given post_id with pagination
        const result = await client.query(
            `SELECT 
                comments.public_id AS comment_id,
                comments.comments AS comment_text,
                comments.created_at AS comment_created_at,
                user_profile.username AS user_name,
                user_profile.picture AS user_picture,
                user_profile.public_id AS user_public_id
            FROM comments
            JOIN user_profile ON comments.user_id = user_profile.id
            WHERE comments.post_id = $1
            ORDER BY comments.created_at DESC
            LIMIT $2 OFFSET $3`,
            [pid, limit, offset]
        );

        // Query to get the total count of comments for pagination info
        const countResult = await client.query(
            'SELECT COUNT(*) FROM comments WHERE post_id = $1',
            [pid]
        );
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
        console.error(error);
        return res.status(500).json({ error: 'Error retrieving comments for the post.' });
    } finally {
        client.release();
    }
});


const AllowedToViewPost = async (user_id, post_id) => {
  try {
    const postQuery = await db.query(`SELECT user_id, visibility FROM posts WHERE id = $1`, [post_id]);

    if (!postQuery.rows.length) { return { fail: true, error: "Post does not exist." }; }
    const { user_id: postOwner, visibility } = postQuery.rows[0];
    console.log(typeof postOwner + "  " + typeof user_id);
    if (postOwner === user_id || visibility === 'public') { return { allow: true, fail: false }; }

    if (visibility === 'private') { return { allow: false, fail: false }; }
    const result = await isMutualFollow(user_id, postOwner);
    if (!result.success) { return { fail: true }; }
    return { fail: false, allow: result.isConnected };

  } catch (err) {
    // Optional: log to an error logger like Winston/Sentry
    console.error("AllowedToViewPost error:", err);
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
        console.error('Error validating comment relation:', err);
        return { valid: false, error: 'Internal server error' };
    } 
};


module.exports = router;
