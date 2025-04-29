const express = require('express');
const db = require("../../config/db");

const upload = require('../../config/multer');  // Import multer configuration
const { verifyToken } = require('../../config/jwt'); // Import JWT verification middleware
require('dotenv').config({ path: '../.env' });

const tagsHandler = require('../../config/tags');

const { allowedStatus, 
        queryStatus, queryPPID, tagsValidator,
        queryPostUID, hasUploadedFiles, stringArrayParser,
        sanitizeInput, isValidUUID, allowedDeleteMedia,
        validateArrayInput
        } = require('../../config/defines');

const { insertMedia, updateMedia, deleteMedia } = require('../../config/uploads');
const logger = require('../../config/logger');


const router = express.Router();

const isvalidtitleLength = (title) => { return title.length <= process.env.MAX_POST_TITLE_LENGTH; }

//  verifyToken,  

const insertPostMedia = async (client, files, postId) => {
    return await insertMedia({
        client,
        files,
        targetId: postId,
        tableName: 'postmedia',
        foreignKey: 'post_id',
        imageDir: process.env.POST_IMAGE_DIR,
        videoDir: process.env.POST_VIDEO_DIR
        });
    }

const updatePostMedia = async (client, files, postId) => {
    return await updateMedia({
        client, 
        files,
        targetId: postId,
        tableName: 'postmedia',
        idColumn: 'post_id',
        imageDir: process.env.POST_IMAGE_DIR,
        videoDir: process.env.POST_VIDEO_DIR
    });
    }

const deletePostMedia = async (client, postId, mediaType) => {
    await deleteMedia({
        client,
        targetId: postId,
        tableName: 'postmedia',
        idColumn: 'post_id',
        imageDir: process.env.POST_IMAGE_DIR,
        videoDir: process.env.POST_VIDEO_DIR,
        mediaType
    });
    
    }

router.post('/',verifyToken ,upload.Media.array('media', process.env.MAX_POST_MEDIA), async (req, res) => {
    let { visibility, tags, title, content } = req.body ?? {}; // Destructure the request body

    if (!title) {
        return res.status(400).json({ error: "Titles are required." });
        } // make sure title and content are provided
    if (!isvalidtitleLength(title)) {
        return res.status(400).json({ error: "Title is too long." });
        } // check title length
    
    if (!content) content = "";
    
    if ((title !== undefined && typeof title !== 'string') ||
        (content !== undefined && typeof content !== 'string')
        ) return res.status(400).json({ error: "Data must be strings." });
    
    tags = stringArrayParser(tags);
    if (tags !== undefined && !tagsValidator(tags))
        { return res.status(400).json({ error: "Tags must be an array of strings." }); } // check tags format
    
    if (tags !== undefined){
        let maxItem = parseInt(process.env.POST_TAGS_MAX_ITEM) || 20;
        let maxCharLength = parseInt(process.env.POST_TAGS_MAX_CHAR_LENGTH) || 20;
        const processed_tags = validateArrayInput(tags, {maxLength: maxCharLength, maxItems: maxItem});
        if (!processed_tags.success)
            return res.status(400).json({ error: processed_tags.error });
        else tags  = processed_tags.data;
        }


    const userId =  req.user.id; // Get the user ID from the token
    
    if (visibility === undefined) { // fetch the user status if not provided
        const decoded = await queryStatus(userId);  // await the async function
        if (!decoded.success) return res.status(400).json({ error: decoded.error });  // handle the error
        visibility = decoded.status;  // assign the retrieved status to the visibility of the psot
        }
    else if (typeof visibility !== 'string' || !allowedStatus.includes(visibility)) {
        return res.status(400).json({ error: 'Invalid status value.' });
        }

    title = sanitizeInput(title);
    content = sanitizeInput(content);
    
    const client = await db.connect();
    try {
        await client.query('BEGIN;');

        const querypost = 'INSERT INTO posts (title, content, user_id, visibility) VALUES ($1, $2, $3, $4) RETURNING id, public_id';
        const postResult = await client.query(querypost, [title, content, userId, visibility]);
        const {id, public_id} = postResult.rows[0]; // Get the ID of the newly created post
        const postId = id;
        
        if (tags !== undefined){ // perform tags linking
            await tagsHandler.insertTagsToEntity(client, postId, tags, 'post_tags', 'post_id');
            }

        if (hasUploadedFiles(req.files)){
            const insertmedia = await insertPostMedia(client, req.files, postId);
            if (!insertmedia.success)
                return res.status(400).json({error: insertmedia.error });
            }
        
        logger.info(`Post created with ID: ${public_id}`); // Log the post creation
        await client.query('COMMIT;');
        return res.status(200).json({"PostID": public_id});

        } catch (err){
            logger.error("Error during post creation:", err);
            await client.query('ROLLBACK;');
            return res.status(500).json({ error: "Database error.", err });

        } finally {
            client.release();
            }
    });

router.post('/:id', verifyToken, upload.none(), async (req, res) => {
    const id = req.body.id || req.params.id;
    let { status, title, content } = req.body ?? {};

    if (typeof id !== 'string'){
        return res.status(400).json({error: "Post_Id required."});
        }

    if (!isValidUUID(id)) // safety precautions
        return res.status(400).json({ error: "Invalid UUID(s) provided."});
    title = sanitizeInput(title);
    content = sanitizeInput(content);

    let rid = await queryPPID (id);
    if (!rid.success) return res.status(400).json({ error: rid.error });
    rid = rid.id; // convert public id to posts id


    if ((title !== undefined && typeof title !== 'string') ||
        (content !== undefined && typeof content !== 'string') ||
        (status !== undefined && typeof status !== 'string'))
        return res.status(400).json({error: 'Title and content must be strings if provided.'});
    
    const userId =  req.user.id; // Get the user ID from the token

    if (status === undefined) { // fetch the user status if not provided
        const decoded = await queryStatus(userId);  // await the async function
        if (!decoded.success) return res.status(400).json({ error: decoded.error });  // handle the error
        status = decoded.status;  // assign the retrieved status
        }
    else if (typeof status !== 'string' || !allowedStatus.includes(status)) {
        return res.status(400).json({ error: 'Invalid status value.' });
        }
        
    const querypost = 'INSERT INTO posts (title, content, user_id, visibility, ref_id) VALUES ($1, $2, $3, $4, $5) RETURNING public_id';
    
    try {
        const postResult = await db.query(querypost, [title, content, userId, status, rid]);
        const public_id = postResult.rows[0].public_id;

        logger.info(`Post created with ID: ${public_id}`); // Log the post creation
        res.status(200).json({"PostID": public_id});
        } catch (err) {
            logger.error("Error during post creation:", err);
            res.status(500).json({ error: "Database error.", err });
            }
    });

router.put('/:post_id', verifyToken, upload.Media.array('media', process.env.MAX_POST_MEDIA), async (req, res) => {
    const { visibility, deletemedia } = req.body ?? {}; // Destructure the request body
    let { tags, title, content } = req.body ?? {};
    const pid = req.params.post_id;

    const hasAnyUpdate =
        title !== undefined ||
        content !== undefined ||
        visibility !== undefined ||
        hasUploadedFiles(req.files);

    if (!hasAnyUpdate  && deletemedia === undefined && tags === undefined) { // make sure atleast one attribute will be updated.
        return res.status(400).json({ error: 'No update fields provided' });
        } 
    
    if ( // prevent invalid data format.
        (title !== undefined  && typeof title !== 'string') ||
        (content !== undefined   && typeof content !== 'string') ||
        (tags !== undefined   && typeof tags !== 'string') ||
        (visibility !== undefined && typeof visibility !== 'string') ||
        (deletemedia !== undefined && typeof deletemedia !== 'string')
        ) return res.status(400).json({ error: "Invalid data format" });
    
    if (title === "")
        return res.status(400).json({ error: 'Title cannot be empty.' });

    if (typeof pid !== 'string'){ // require an id
        return res.status(400).json({error: "PostId required."});
        }
    if (!isValidUUID(pid)) // security measures
        return res.status(400).json({ error: "Invalid UUID(s) provided."});
    title = sanitizeInput(title);
    content = sanitizeInput(content);

    if (title !== undefined && !isvalidtitleLength(title)) { // check title length
        return res.status(400).json({ error: "Title is too long." });
        } 
    
    if (tags !== undefined){
        let maxItem = parseInt(process.env.POST_TAGS_MAX_ITEM) || 20;
        let maxCharLength = parseInt(process.env.POST_TAGS_MAX_CHAR_LENGTH) || 20;
        const processed_tags = validateArrayInput(tags, {maxLength: maxCharLength, maxItems: maxItem});
        if (!processed_tags.success)
            return res.status(400).json({ error: processed_tags.error });
        else tags  = processed_tags.data;
        }
    
    if (visibility !== undefined && (typeof visibility !== 'string' || !allowedStatus.includes(visibility))) {
        return res.status(400).json({ error: 'Invalid status value.' });
        }

    let rid = await queryPPID (pid); // convert public id to posts id
    if (!rid.success) return res.status(404).json({ error: rid.error });
    rid = rid.id; 
    
    const userId =  req.user.id; // Get the user ID from the token
    
    const fetchowner = await queryPostUID(pid); // search for the owner of the posts. using public id
    if (!fetchowner.success) return res.status(400).json({error: fetchowner.error});

    // make sure user are only allowed to update his own posts.
    if (fetchowner.user_id != userId){
        logger.error(`User ${userId} attempted to update post ${pid} without permission.`);
        return res.status(400).json({error: "Unathorized Update."});
        }
    
    const client = await db.connect();
    try {
        await client.query('BEGIN;');

        if (typeof deletemedia === 'string'){
            if (allowedDeleteMedia.includes(deletemedia)){ // remove media (image, video, all)
                await deletePostMedia(client, rid, deletemedia);
                }
            else { return res.status(404).json({error: `Invalid Deletemedia(image, video, all): ${deletemedia}`}); }
            }
        
        let resultquery = null;
        if (hasAnyUpdate) {// updates 
            const updates = [];
            const values = [];
            let i = 1;

            if (title !== undefined){
                updates.push(`title = $${i++}`);
                values.push(title);
                }
            if (content !== undefined){
                updates.push(`content = $${i++}`);
                values.push(content);
                }
            
            updates.push(`updated_at = NOW()`);

            const query = `UPDATE posts SET ${updates.join(', ')} WHERE id = $${i} RETURNING public_id;`;
            values.push(rid); // Add the post ID as the last value
            
            try { resultquery = await db.query(query, values); }
            catch (error) { res.status(500).json({ error: error }); }
            }
        
        if (tags !== undefined){ // perform tags linking
            await tagsHandler.updateTagsToEntity(client, rid, tags, 'post');
            }


        if (hasUploadedFiles(req.files)){ // manage files
            const result = await updatePostMedia(db, req.files, rid);
            if (!result.success) return {success: false, error: result.error };
            }

        await client.query('COMMIT;');
        logger.info(`Post updated with ID: ${resultquery.rows[0].public_id}`); // Log the post creation
        return res.status(200).json({msg:'Post updated successfully.'});

        } catch (err) {
            await client.query('ROLLBACK;');
            logger.error("Error during post update:", err);
            return res.status(500).json({ error: "Database error.", err });
        } finally {
            client.release();
            }
    });

router.delete('/:post_id', verifyToken, async (req, res) => {
    const post_id = req.params.post_id;

    if (!isValidUUID(post_id)) // security measures
        return res.status(400).json({ error: "post_id must be in UUID format."});

    let puid = await queryPostUID (post_id); // querty post user id
    if (!puid.success) return res.status(404).json({ error: puid.error });
    puid = puid.user_id; 
    if (puid !==  req.user.id)
        return res.status(403).json({ error: "Unathorized deletion of posts."});

    try {
        const deleteQuery = `UPDATE posts SET deleted_at = NOW() WHERE public_id = $1 AND 
                user_id = $2 AND deleted_at IS NULL
                RETURNING *`;
        const { rows } = await db.query(deleteQuery, [post_id, puid]);
        
        if (!rows.length) return res.status(400).json({ error: "Error post not found or already deleted." });

        logger.info(`Post deleted with ID: ${post_id}`); // Log the post deletion
        res.status(200).json({ msg: `Post(${post_id}) deleted successfully.` });
    } catch (err) {
        logger.error("Error during post deletion:", err);
        return res.status(500).json({ error: "Error deleting a post." });
        }
    });

      
module.exports = router;

