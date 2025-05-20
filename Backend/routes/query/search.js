const { verifyToken } = require("../../config/jwt");

const upload = require('../../config/multer');  // Import multer configuration
const db = require("../../config/db");
const express = require('express');
const router = express.Router();

const logger = require('../../config/logger');  // Importing the logger
require('dotenv').config({ path: '../.env' });
// user search
// post search
// recipe search


router.get('/search', async (req, res) => {
    const keyword = req.query.keyword;
    const narrow = req.query.narrow || '';

    if (!keyword) {
        return res.status(400).json({ message: 'Keyword is required' });
    }

    try {
        let queryParts = [];

        if (!narrow || narrow === 'profiles') {
            queryParts.push(`SELECT 
                'user_profile' AS source,
                user_profile.public_id,
                user_profile.username AS name,
                'user_profile' AS type,
                json_build_object(
                    'username', user_profile.username,
                    'picture', um.fname
                ) AS owner,
                GREATEST(
                    similarity(user_profile.username, $1),
                    similarity(user_profile.biography, $1)
                ) AS rank
            FROM user_profile
            LEFT JOIN usermedia um ON um.user_id = user_profile.id AND um.type = 'profile'
            WHERE user_profile.username ILIKE '%' || $1 || '%' 
            OR user_profile.biography ILIKE '%' || $1 || '%'
            `);
        }

        if (!narrow || narrow === 'posts') {
            queryParts.push(`
                SELECT 
                    'posts' AS source,
                    posts.public_id,
                    posts.title AS name,
                    'post' AS type,
                    json_build_object(
                        'username', user_profile.username,
                        'picture', user_profile.picture
                    ) AS owner,
                    GREATEST(
                        similarity(posts.title, $1),
                        similarity(posts.content, $1)
                    ) AS rank
                FROM posts
                JOIN user_profile ON posts.user_id = user_profile.id
                WHERE posts.title ILIKE '%' || $1 || '%' OR posts.content ILIKE '%' || $1 || '%'
            `);
        }

        if (!narrow || narrow === 'recipes') {
            queryParts.push(`
                SELECT 
                    'recipe' AS source,
                    recipe.public_id,
                    recipe.title AS name,
                    'recipe' AS type,
                    json_build_object(
                        'username', user_profile.username,
                        'picture', user_profile.picture
                    ) AS owner,
                    GREATEST(
                        similarity(recipe.title, $1),
                        similarity(recipe.description, $1),
                        similarity(recipe.steps::text, $1)
                    ) AS rank
                FROM recipe
                JOIN user_profile ON recipe.author_id = user_profile.id
                WHERE recipe.title ILIKE '%' || $1 || '%' OR recipe.description ILIKE '%' || $1 || '%' OR recipe.steps::text ILIKE '%' || $1 || '%'
            `);
        }
       
        if (!narrow || narrow === 'tags') {
            queryParts.push(`
                SELECT 
                    'tags' AS source,
                    tags.public_id,
                    tags.name AS name,
                    'tag' AS type,
                    NULL::json AS owner,
                    GREATEST(
                        similarity(tags.name::text, $1::text),
                        similarity(tags.description::text, $1::text)
                    ) AS rank
                FROM tags
                WHERE tags.name ILIKE '%' || $1 || '%' OR tags.description ILIKE '%' || $1 || '%'
            `);
        }
                

        if (queryParts.length === 0) {
            return res.status(400).json({ message: 'Invalid narrow option' });
        }

        let finalQuery = `
            (
                ${queryParts.join(' UNION ALL ')}
            ) AS combined
            ORDER BY rank DESC NULLS LAST, name ASC
        `;

        const result = await db.query(`SELECT * FROM ${finalQuery}`, [keyword]);

        res.status(200).json({
            message: 'Search results retrieved successfully',
            data: result.rows,
        });

    } catch (error) {
        console.error('Search error', error);
        res.status(500).json({ message: 'Search failed', error: error.message });
    }
});


module.exports = router;

  /*
router.post('/search/', justifyToken ,upload.none(), async (req, res) => {


    });
*/