const express = require('express');
const db = require("../../config/db");

const { 
        queryPPID, queryCPID,
        isUserConnected, sanitizeInput,
        isValidUUID
        } = require('../../config/defines');

const upload = require('../../config/multer');  // Import multer configuration
const { verifyToken } = require('../../config/jwt'); // Import JWT verification middleware

const router = express.Router();

router.post('/',verifyToken, upload.none(), async (req, res) => {
    const { post_id, reference_id } = req.body ?? {};
    let { comments } = req.body ?? {};
    const userId = req.user.payload.user_id; // Get the user ID from the token   

    if (!post_id || !comments){
        return res.status(400).json({ error: "post_id and comments are required." });
        }
    if (typeof post_id !== 'string' ||
        typeof comments !== 'string' ||
        (reference_id  !== undefined && typeof reference_id !== 'string')
        ) return res.status(400).json({error : "Invalid data type(all data must be a string)."});
    
    if (!isValidUUID(post_id) || (typeof reference_id === 'string' && !isValidUUID(reference_id)) ) // make sure a valid uuid
        return res.status(400).json({ error: "Invalid UUID(s) provided."});

    comments = sanitizeInput(comments); // prevent XSS

    let pid = await queryPPID (post_id);
    if (!pid.success) return res.status(400).json({ error: pid.error });
    pid = pid.id; // convert public post id to posts id
    
    let rid = null;
    if (reference_id !== undefined){
        rid = await queryCPID (reference_id);
        if (!rid.success) return res.status(400).json({ error: rid.error });
        rid = rid.id; // convert public comment id to comment id

        const validation = await validateCommentRelation(pid, rid);
        if (!validation.valid)
            { return res.status(400).json({ error: 'Invalid comment/post relation.' }); }
        const isallowedToView = await AllowedToViewPost(userId, pid);
        if (isallowedToView.fail)
            { return res.status(400).json({ error: 'Authorization checking fail.' }); }
        else if (!isallowedToView.allow)
            { return res.status(400).json({ error: 'Not allowed to comment.' }); }
        }
    try  {
        const querycomment = `INSERT INTO comments (ref_id, post_id, user_id, comments) VALUES ($1, $2, $3, $4) RETURNING public_id`;
        const commentResult = await db.query(querycomment, [rid, pid, userId, comments]);
        const public_id = commentResult.rows[0].public_id;
        return res.status(200).json({"CommentID": public_id});
        } catch (err) { return res.status(500).json({error: "Comment Insertion Error."})}
    });


router.put('/', verifyToken, upload.none(), async (req, res) => {
    const { comment_id } = req.body ?? {};
    let { comments } = req.body ?? {};
    const userId = req.user.payload.user_id;

    // Check required fields
    if (!comment_id || !comments) {
        return res.status(400).json({ error: "comment_id and comments are required." });
    }

    // Validate types
    if (typeof comment_id !== 'string' || typeof comments !== 'string') {
        return res.status(400).json({ error: "Invalid data type." });
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


router.delete('/', verifyToken, upload.none(), async (req, res) => {
    const { comment_id } = req.body ?? {};
    const userId = req.user.payload.user_id; // Get the user ID from the token

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


 

const AllowedToViewPost = async (user_id, post_id) => {
  try {
    const postQuery = await db.query(`SELECT user_id, visibility FROM posts WHERE id = $1`, [post_id]);

    if (!postQuery.rows.length) { return { fail: true, error: "Post does not exist." }; }

    const { user_id: postOwner, visibility } = postQuery.rows[0];

    if (postOwner === user_id || visibility === 'public') { return { allow: true, fail: false }; }

    if (visibility === 'private') { return { allow: false, fail: false }; }

    const result = await isUserConnected(user_id, postOwner);
    if (!result.success) { return { fail: true }; }

    return { fail: false, allow: result.isConnected };

  } catch (err) {
    // Optional: log to an error logger like Winston/Sentry
    console.error("AllowedToViewPost error:", err);
    return { fail: true, error: "Unexpected error." };
    }
};


const validateCommentRelation = async (postId, refId) => {
    try { // If refId is provided, ensure it exists and belongs to the same post
        if (refId) {
            const { rows } = await db.query(
            `SELECT id FROM comments WHERE post_id = $1  AND id = $2 AND deleted_at IS NULL`,
            [postId, refId]
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
