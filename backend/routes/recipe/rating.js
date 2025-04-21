const express = require('express');
const db = require("../../config/db");
const { saveFile, deleteFile }  = require('../../config/uploads');



const upload = require('../../config/multer');  // Import multer configuration
const { verifyToken } = require('../../config/jwt'); // Import JWT verification middleware
require('dotenv').config({ path: '../.env' });
const { sanitizeInput, isValidUUID, queryRPID } = require('../../config/defines');

const router = express.Router();

router.post('/rate/:recipeId', verifyToken, upload.Media.single("media"), async (req, res) => {
    const { recipeId: public_recipe_id } = req.params;
    const { rating, content } = req.body ?? {};
    const userId = req.user.id;

    // Validate recipeId (UUID format)
    if (!isValidUUID(public_recipe_id))
        return res.status(400).json({ error: 'Invalid recipe ID format.' });

    if (!rating)
        return res.status(400).json({ error: 'rating is required.' });

    // Validate rating (required and must be integer 1-5)
    const parsedRating = parseInt(rating);
    if (isNaN(parsedRating))
        return res.status(400).json({ error: 'Rating must be a number.' });

    if (!Number.isInteger(parsedRating) || parsedRating < 1 || parsedRating > 5)
        return res.status(400).json({ error: 'Rating must be an integer from 1 to 5.' });

    // Validate content (must be string if exists)
    if (content !== undefined && typeof content !== 'string')
        return res.status(400).json({ error: 'Content must be a string.' });

    const sanitizedContent = content ? sanitizeInput(content) : "";

    // Query actual recipe ID
    let recipe_id = await queryRPID(public_recipe_id);
    if (!recipe_id.success)
        return res.status(404).json({ error: recipe_id.error });
    recipe_id = recipe_id.id;

    // Check for existing rating
    const existing = await db.query(
        'SELECT 1 FROM recipe_rating WHERE recipe_id = $1 AND user_id = $2',
        [recipe_id, userId]
    );
    if (existing.rowCount > 0)
        return res.status(409).json({ error: 'You have already rated this recipe.' });

    let mediaFilename = null;
    if (req.file) {
        try {
            // Save the uploaded file and get the filename to store in the database
            mediaFilename = await saveFile(process.env.RECIPE_RATING_MEDIA_DIR, req.file);
        } catch (error) {
            return res.status(500).json({ error: 'Failed to save media file' });
            }
        }
    // Insert rating
    try {

        await db.query(
            `INSERT INTO recipe_rating (recipe_id, user_id, rating, content, fname)
             VALUES ($1, $2, $3, $4, $5)`,
            [recipe_id, userId, parsedRating, sanitizedContent, mediaFilename]
            );
        return res.status(201).json({ message: 'Rating submitted successfully.' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Database error.', details: err });
    }
});


router.put('/rate/:public_recipe_id', verifyToken, upload.Media.single("media"), async (req, res) => {
    const { recipeId: public_recipe_id } = req.params;
    const { rating, content, deletemedia } = req.body ?? {};
    const userId = req.user.id;

    // Validate recipeId (UUID format)
    if (!isValidUUID(public_recipe_id))
        return res.status(400).json({ error: 'Invalid recipe ID format.' });

    if (!rating && !content && !deletemedia && !req.file)
        return res.status(400).json({ error: 'No Attributes provided.' });

    // Validate rating (must be integer 1-5 if provided)
    let parsedRating = null;
    if (rating !== undefined) {
        parsedRating = parseInt(rating);
        if (isNaN(parsedRating))
            return res.status(400).json({ error: 'Rating must be a valid number.' });

        if (parsedRating < 1 || parsedRating > 5)
            return res.status(400).json({ error: 'Rating must be an integer from 1 to 5.' });
    }
    // Validate content (must be string if exists)
    let sanitizedContent = typeof content === 'string' ? sanitizeInput(content) : undefined;

    // Query actual recipe ID
    let recipe_id = await queryRPID(public_recipe_id);
    if (!recipe_id.success)
        return res.status(404).json({ error: recipe_id.error });
    recipe_id = recipe_id.id;

    // Check if the rating exists and is associated with the current user
    const existingRating = await db.query(
        'SELECT * FROM recipe_rating WHERE recipe_id = $1 AND user_id = $2',
        [recipe_id, userId]
    );
    if (existingRating.rowCount === 0)
        return res.status(404).json({ error: 'Rating not found for this user and recipe.' });

    let mediaFilename = existingRating.rows[0].fname; // Retain existing media if no new media is uploaded

    if (deletemedia === 'True' && mediaFilename !== null && !req.file){ // only when delete media and no file given
        const delquery = 'UPDATE recipe_rating SET fname = null WHERE recipe_id = $1 AND user_id = $2';
        await db.query(delquery, [recipe_id, userId]);
        deleteFile(process.env.RECIPE_RATING_MEDIA_DIR, mediaFilename);
        }

    if (req.file) {
        try {
            // Save the uploaded file and get the filename to store in the database
            const newMediaFilename = await saveFile(process.env.RECIPE_RATING_MEDIA_DIR, req.file);

            // If a new file is provided, delete the old file
            if (mediaFilename) {
                deleteFile(process.env.RECIPE_RATING_MEDIA_DIR, mediaFilename); // Delete the old file
            }

            mediaFilename = newMediaFilename;
        } catch (error) {
            return res.status(500).json({ error: 'Failed to save media file' });
        }
    }

    // Update only the fields provided by the user
    const updateFields = [];
    const updateValues = [];

    if (parsedRating !== null) {
        updateFields.push('rating');
        updateValues.push(parsedRating);
    }

    if (sanitizedContent !== undefined) {
        updateFields.push('content');
        updateValues.push(sanitizedContent);
    }

    if (mediaFilename !== existingRating.rows[0].fname) {
        updateFields.push('fname');
        updateValues.push(mediaFilename);
    }

    // Proceed if there are fields to update
    if (updateFields.length > 0) {
        const client = await db.connect();
        await client.query('BEGIN'); // Start transaction
        try {
            // Construct the SET clause for the query
            const setClause = updateFields.map((field, index) => `${field} = $${index + 1}`).join(', ');
            const queryValues = [...updateValues, recipe_id, userId];

            await client.query(
                `UPDATE recipe_rating SET ${setClause} WHERE recipe_id = $${updateValues.length + 1} AND user_id = $${updateValues.length + 2}`,
                queryValues
            );

            await client.query('COMMIT'); // Commit transaction
        } catch (err) {
            await client.query('ROLLBACK'); // Rollback transaction in case of error
            console.error(err);
            return res.status(500).json({ error: 'Database error.', details: err });
            }
        finally {
            client.release();
            }
    } else if (deletemedia === undefined) {
        return res.status(400).json({ error: 'No valid fields to update.' });
        }
    return res.status(200).json({ message: 'Rating updated successfully.' });
});


router.delete('/rate/:recipeId', verifyToken, async (req, res) => {
    const { recipeId: public_recipe_id } = req.params;
    const userId = req.user.id;

    // Validate recipeId
    if (!isValidUUID(public_recipe_id))
        return res.status(400).json({ error: 'Invalid recipe ID format.' });

    // Get internal recipe ID
    let recipe_id = await queryRPID(public_recipe_id);
    if (!recipe_id.success)
        return res.status(404).json({ error: recipe_id.error });
    recipe_id = recipe_id.id;

    const client = await db.connect();
    try {
        // Check if the rating exists and fetch the media filename (if any)
        const existing = await client.query(
            'SELECT fname FROM recipe_rating WHERE recipe_id = $1 AND user_id = $2',
            [recipe_id, userId]
        );

        if (existing.rowCount === 0)
            return res.status(404).json({ error: 'Rating not found.' });

        const { fname } = existing.rows[0];

        await client.query('BEGIN');

        // Delete the rating
        await client.query(
            'DELETE FROM recipe_rating WHERE recipe_id = $1 AND user_id = $2',
            [recipe_id, userId]
        );

        // Delete associated media if it exists
        if (fname) {
            try {
                deleteFile(process.env.RECIPE_RATING_MEDIA_DIR, fname);
            } catch (err) {
                await client.query('ROLLBACK');
                return res.status(500).json({ error: 'Failed to delete associated media file.', details: err });
            }
        }

        await client.query('COMMIT');
        return res.status(200).json({ message: 'Rating deleted successfully.' });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        return res.status(500).json({ error: 'Database error.', details: err });
    } finally {
        client.release();
    }
});

module.exports = router;
