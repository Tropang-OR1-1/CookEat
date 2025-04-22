const express = require('express');
const db = require("../../config/db");

const upload = require('../../config/multer');  // Import multer configuration
const { verifyToken } = require('../../config/jwt'); // Import JWT
const { isValidUUID } = require('../../config/defines');
require('dotenv').config({ path: '../.env' });

const router = express.Router();

router.post('/save/post/:postId', verifyToken, async (req, res) => {
    const { postId } = req.params;
    const userId = req.user.id;

    // Validate UUID format
    if (!isValidUUID(postId)) {
        return res.status(400).json({ error: 'Invalid post ID format.' });
    }

    const client = await db.connect();
    try {
        // Check if the post exists
        const postCheck = await client.query(
            'SELECT 1 FROM posts WHERE public_id = $1',
            [postId]
        );

        if (postCheck.rowCount === 0) {
            return res.status(404).json({ error: 'Post not found.' });
        }

        // Insert into saved_posts, avoid duplicate
        await client.query(
            `INSERT INTO saved_posts (user_id, post_uuid)
             VALUES ($1, $2)
             ON CONFLICT DO NOTHING`,
            [userId, postId]
        );

        return res.status(201).json({ message: 'Post saved successfully.' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Database error.', details: err });
    } finally {
        client.release();
    }
});


router.post('/save/recipe/:recipeId', verifyToken, async (req, res) => {
    const { recipeId } = req.params;
    const userId = req.user.id;

    // Validate UUID format for recipeId
    if (!isValidUUID(recipeId)) {
        return res.status(400).json({ error: 'Invalid recipe ID format.' });
    }

    const client = await db.connect();
    try {
        // Check if the recipe exists
        const recipeCheck = await client.query(
            'SELECT 1 FROM recipe WHERE public_id = $1',
            [recipeId]
        );

        if (recipeCheck.rowCount === 0) {
            return res.status(404).json({ error: 'Recipe not found.' });
        }

        // Insert into saved_recipes, avoid duplicate
        await client.query(
            `INSERT INTO saved_recipes (user_id, recipe_uuid)
             VALUES ($1, $2)
             ON CONFLICT DO NOTHING`,
            [userId, recipeId]
        );

        return res.status(201).json({ message: 'Recipe saved successfully.' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Database error.', details: err });
    } finally {
        client.release();
    }
});

router.delete('/save/post/:postId', verifyToken, async (req, res) => {
    const { postId } = req.params;
    const userId = req.user.id;

    // Validate UUID format for postId
    if (!isValidUUID(postId)) {
        return res.status(400).json({ error: 'Invalid post ID format.' });
    }

    const client = await db.connect();
    try {
        // Check if the post is already saved by the user
        const postCheck = await client.query(
            'SELECT 1 FROM saved_posts WHERE user_id = $1 AND post_uuid = $2',
            [userId, postId]
        );

        if (postCheck.rowCount === 0) {
            return res.status(404).json({ error: 'Saved post not found.' });
        }

        // Delete the saved post entry
        await client.query(
            'DELETE FROM saved_posts WHERE user_id = $1 AND post_uuid = $2',
            [userId, postId]
        );

        return res.status(200).json({ message: 'Saved post deleted successfully.' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Database error.', details: err });
    } finally {
        client.release();
    }
});

router.delete('/save/recipe/:recipeId', verifyToken, async (req, res) => {
    const { recipeId } = req.params;
    const userId = req.user.id;

    // Validate UUID format for recipeId
    if (!isValidUUID(recipeId)) {
        return res.status(400).json({ error: 'Invalid recipe ID format.' });
    }

    const client = await db.connect();
    try {
        // Check if the recipe is already saved by the user
        const recipeCheck = await client.query(
            'SELECT 1 FROM saved_recipes WHERE user_id = $1 AND recipe_uuid = $2',
            [userId, recipeId]
        );

        if (recipeCheck.rowCount === 0) {
            return res.status(404).json({ error: 'Saved recipe not found.' });
        }

        // Delete the saved recipe entry
        await client.query(
            'DELETE FROM saved_recipes WHERE user_id = $1 AND recipe_uuid = $2',
            [userId, recipeId]
        );

        return res.status(200).json({ message: 'Saved recipe deleted successfully.' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Database error.', details: err });
    } finally {
        client.release();
    }
});

router.get('/saved/recipes', verifyToken, async (req, res) => {
    const userId = req.user.id;
    
    // Get page from query params, default to 1 if not provided
    const page = parseInt(req.query.page) || 1;
    
    // Get the page limit from environment variables
    const limit = parseInt(process.env.SAVES_PAGE_LIMIT) || 10;
    
    // Calculate the offset based on the page number
    const offset = (page - 1) * limit;

    const client = await db.connect();
    try {
        // Query to get saved recipes with pagination
        const result = await client.query(
            'SELECT recipe_uuid, created_at FROM saved_recipes WHERE user_id = $1 LIMIT $2 OFFSET $3',
            [userId, limit, offset]
        );

        // Query to get the total count of saved recipes for pagination info
        const countResult = await client.query(
            'SELECT COUNT(*) FROM saved_recipes WHERE user_id = $1',
            [userId]
        );
        const totalRecords = parseInt(countResult.rows[0].count);
        const totalPages = Math.ceil(totalRecords / limit);

        return res.status(200).json({
            data: result.rows,
            page: page,
            limit: limit,
            totalPages: totalPages,
            totalRecords: totalRecords
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Error retrieving saved recipes.' });
    } finally {
        client.release();
        }
});

router.get('/saved/posts', verifyToken, async (req, res) => {
    const userId = req.user.id;
    
    // Get page from query params, default to 1 if not provided
    const page = parseInt(req.query.page) || 1;
    
    // Get the page limit from environment variables, default to 10 if not provided
    const limit = parseInt(process.env.SAVES_PAGE_LIMIT) || 10;
    
    // Calculate the offset based on the page number
    const offset = (page - 1) * limit;

    const client = await db.connect();
    try {
        // Query to get saved posts with pagination
        const result = await client.query(
            'SELECT post_uuid, created_at FROM saved_posts WHERE user_id = $1 LIMIT $2 OFFSET $3',
            [userId, limit, offset]
        );
        // Query to get the total count of saved posts for pagination info
        const countResult = await client.query(
            'SELECT COUNT(*) FROM saved_posts WHERE user_id = $1',
            [userId]
        );
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
        console.error(error);
        return res.status(500).json({ error: 'Error retrieving saved posts.' });
    } finally {
        client.release();
        }
});

module.exports = router;
