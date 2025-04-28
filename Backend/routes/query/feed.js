
const upload = require('../../config/multer');  // Import multer configuration
const db = require("../../config/db");
const express = require('express');
const router = express.Router();

const logger = require('../../config/logger');  // Importing the logger
const { justifyToken } = require('../../config/jwt');  // Import JWT verification middleware
const { getPaginationParams, isValidUUID, queryUPID } = require('../../config/defines');  // Import pagination utility
require('dotenv').config({ path: '../.env' });



router.get('/feed/post', justifyToken, upload.none(), async (req, res) => {
    const defaultLimit = parseInt(process.env.DEFAULT_LIMIT) || 10;
    const { page, limit, offset } = getPaginationParams(req.query, defaultLimit); // Get pagination parameters from the request query
    const userId = req.user?.id; // Get the user ID from the token (undefined for non-user feed)
  
    try {
      let queryParams = [limit, offset];  // Default params: limit and offset
  
      if (userId) {
        // Add userId to the params if it's provided
        queryParams.push(userId);
      }
  
      let query = `
        SELECT 
          p.public_id, 
          p.title, 
          p.content, 
          p.view_count, 
          p.created_at, 
          p.updated_at,
          -- Aggregate media filenames and types into a JSON array
          COALESCE(json_agg(
            json_build_object(
              'media_filename', postmedia.fname,
              'media_type', postmedia.media_type
            )
          ) FILTER (WHERE postmedia.fname IS NOT NULL), '[]') AS media,  -- Handle the case with no media
          COUNT(DISTINCT pr.user_id) AS reactions_count,  -- Counting unique user_id for reactions
          r.public_id AS ref_public_id,  -- Join the referenced post and select its public_id
          u.public_id AS author_public_id,
          u.username AS author_username,
          u.picture AS author_picture
        FROM posts p
        LEFT JOIN postmedia ON postmedia.post_id = p.id
        LEFT JOIN post_reaction pr ON pr.post_id = p.id  -- Join post_reaction on post_id
        LEFT JOIN post_tags pt ON pt.post_id = p.id
        LEFT JOIN tags t ON t.id = pt.tags_id
        LEFT JOIN user_profile u ON p.user_id = u.id  -- Join the user_profile table to get author info
        ${userId ? `LEFT JOIN user_tags ut ON ut.user_id = $3 AND ut.tags_id = t.id` : ''}
        LEFT JOIN posts r ON r.id = p.ref_id  -- Join posts table again for referenced post (r = ref post)
        WHERE (p.visibility = 'public'
          ${userId ? `OR (p.visibility = 'private' AND p.user_id = $3) 
                     OR (p.visibility = 'restricted' AND EXISTS 
                         (SELECT 1 FROM followers f 
                          WHERE f.following_user_id = p.user_id 
                          AND f.follower_user_id = $3))` : ''})
        GROUP BY p.id, r.public_id, u.public_id, u.username, u.picture, u.biography  -- Include user columns in GROUP BY
        ORDER BY p.created_at DESC, p.view_count DESC
        LIMIT $1 OFFSET $2
      `;
  
      const posts = await db.query(query, queryParams);
      console.log(posts.rows);  // Log the posts for debugging
      console.log(posts.rows[0]);  // Log the first post for debugging
  
      // Format the posts data to include author details
      const formattedPosts = posts.rows.map(post => ({
        public_id: post.public_id,
        title: post.title,
        content: post.content,
        view_count: post.view_count,
        created_at: post.created_at,
        updated_at: post.updated_at,
        media: post.media,  // Media information
        reactions_count: post.reactions_count,
        ref_public_id: post.ref_public_id,
        author: {
          public_id: post.author_public_id,
          username: post.author_username,
          picture: post.author_picture,
          biography: post.author_bio
        }
      }));
  
      res.status(200).json({
        posts: formattedPosts,
        pagination: {
          page,
          limit,
          total: posts.rows.length,  // Total posts from the current query
        }
      });
    } catch (error) {
      logger.error('Error fetching posts:', error);
      res.status(500).json({ message: 'An error occurred while fetching posts.' });
    }
  });


router.get('/feed/post/:public_id', justifyToken, upload.none(), async (req, res) => {
  const { public_id } = req.params;  // Get the public_id from the request params
  const userId = req.user?.id; // Get the user ID from the token (undefined for non-user feed)

  try {
    let queryParams = [public_id];  // The only param we need is the public_id to fetch the post

    if (userId) {
      // Add userId to the params if it's provided for visibility and reactions
      queryParams.push(userId);
    }

    let query = `
      SELECT 
        p.public_id, 
        p.title, 
        p.content, 
        p.view_count, 
        p.created_at, 
        p.updated_at,
        -- Aggregate media filenames and types into a JSON array
        COALESCE(json_agg(
          json_build_object(
            'media_filename', postmedia.fname,
            'media_type', postmedia.media_type
          )
        ) FILTER (WHERE postmedia.fname IS NOT NULL), '[]') AS media,  -- Handle the case with no media
        COUNT(DISTINCT pr.user_id) AS reactions_count,  -- Counting unique user_id for reactions
        r.public_id AS ref_public_id,  -- Join the referenced post and select its public_id
        u.public_id AS author_public_id,
        u.username AS author_username,
        u.picture AS author_picture
      FROM posts p
      LEFT JOIN postmedia ON postmedia.post_id = p.id
      LEFT JOIN post_reaction pr ON pr.post_id = p.id  -- Join post_reaction on post_id
      LEFT JOIN post_tags pt ON pt.post_id = p.id
      LEFT JOIN tags t ON t.id = pt.tags_id
      LEFT JOIN user_profile u ON p.user_id = u.id  -- Join the user_profile table to get author info
      ${userId ? `LEFT JOIN user_tags ut ON ut.user_id = $2 AND ut.tags_id = t.id` : ''}
      LEFT JOIN posts r ON r.id = p.ref_id  -- Join posts table again for referenced post (r = ref post)
      WHERE p.public_id = $1  -- Filter by public_id
        AND (p.visibility = 'public'
            ${userId ? `OR (p.visibility = 'private' AND p.user_id = $2) 
                       OR (p.visibility = 'restricted' AND EXISTS 
                           (SELECT 1 FROM followers f 
                            WHERE f.following_user_id = p.user_id 
                            AND f.follower_user_id = $2))` : ''})
      GROUP BY p.id, r.public_id, u.public_id, u.username, u.picture, u.biography  -- Include user columns in GROUP BY
    `;

    const posts = await db.query(query, queryParams);
    console.log(posts.rows);  // Log the posts for debugging

    if (posts.rows.length === 0) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Format the post data to include author details
    const post = posts.rows[0];  // Since we're fetching only one post

    const formattedPost = {
      public_id: post.public_id,
      title: post.title,
      content: post.content,
      view_count: post.view_count,
      created_at: post.created_at,
      updated_at: post.updated_at,
      media: post.media,  // Media information
      reactions_count: post.reactions_count,
      ref_public_id: post.ref_public_id,
      author: {
        public_id: post.author_public_id,
        username: post.author_username,
        picture: post.author_picture,
        biography: post.author_bio
      }
    };

    res.status(200).json({
      post: formattedPost
    });
  } catch (error) {
    logger.error('Error fetching post:', error);
    res.status(500).json({ message: 'An error occurred while fetching the post.' });
  }
});


router.get('/feed/recipe', justifyToken, upload.none(), async (req, res) => {
    try {
      const defaultLimit = parseInt(process.env.DEFAULT_LIMIT) || 10;
      const { page, limit, offset } = getPaginationParams(req.query, defaultLimit);
  
      const userId = req.user?.id; // Get the user ID from the token (undefined for non-user feed)
  
      // SQL query string for fetching recipes
      let query = `
        SELECT
          r.public_id,
          r.title,
          r.description,
          r.prep_time,
          r.cook_time,
          r.servings,
          r.difficulty,
          r.thumbnail,
          r.view_count,
          r.created_at,
          u.public_id AS author_public_id,
          u.username AS author_username,
          u.picture AS author_picture,
          COALESCE(AVG(rr.rating), 0) AS average_rating
        FROM public.recipe r
        JOIN public.user_profile u ON r.author_id = u.id
        LEFT JOIN public.recipe_rating rr ON rr.recipe_id = r.id
        WHERE r.deleted_at IS NULL
      `;
  
      // Add condition for mutual followers if userId is provided
      if (userId) {
        query += `
          AND (
            r.author_id IN (
              SELECT following_user_id
              FROM public.followers
              WHERE follower_user_id = $3
            ) 
            OR r.author_id IN (
              SELECT follower_user_id
              FROM public.followers
              WHERE following_user_id = $3
            ) 
            OR r.author_id = $3
          )
        `;
      }
  
      // Group by recipe to allow AVG(rating) calculation
      query += `
        GROUP BY r.id, u.public_id, u.username, u.picture, u.biography
      `;
  
      // Dynamically build ORDER BY based on whether userId is provided
      if (userId) {
        query += `
          ORDER BY 
            CASE WHEN r.author_id IN (
              SELECT following_user_id
              FROM public.followers
              WHERE follower_user_id = $3
            ) THEN 1 ELSE 2 END, -- Prioritize mutual followers
            average_rating DESC,  -- Order by average rating
            r.created_at DESC     -- Then by creation date
        `;
      } else {
        query += `
          ORDER BY 
            average_rating DESC,  -- Order by average rating
            r.created_at DESC     -- Then by creation date
        `;
      }
  
      // Pagination and sorting
      query += `
        LIMIT $1 OFFSET $2
      `;
  
      // Set the parameters: if userId exists, pass it as the third parameter, else pass only limit and offset
      let params = [];
      if (userId) {
        params = [limit, offset, userId]; // Pass limit, offset, and userId when userId is available
      } else {
        params = [limit, offset]; // Only pass limit and offset when userId is not available
      }
  
      // Execute the query with parameters
      const recipes = await db.query(query, params);
  
      // Check if no recipes are found
      if (recipes.rows.length === 0) {
        return res.status(404).json({ message: 'No recipes found.' });
      }
  
      // Format the response for consistency and clarity
      const formattedRecipes = recipes.rows.map(recipe => ({
        public_id: recipe.public_id,
        title: recipe.title,
        description: recipe.description,
        prep_time: recipe.prep_time,
        cook_time: recipe.cook_time,
        servings: recipe.servings,
        difficulty: recipe.difficulty,
        thumbnail: recipe.thumbnail,
        view_count: recipe.view_count,
        created_at: recipe.created_at,
        average_rating: recipe.average_rating,
        author: {
          public_id: recipe.author_public_id,
          username: recipe.author_username,
          picture: recipe.author_picture,
          biography: recipe.author_bio
        }
      }));
  
      // Return the response with pagination information
      res.status(200).json({
        recipe: formattedRecipes,
        pagination: { // Return the total number of recipes for better frontend pagination control
          page,
          limit,
          total: recipes.rowCount  
          }
      });
    } catch (error) {
      console.error('Error fetching recipes:', error);
      res.status(500).json({ message: 'Internal server error.' });
    }
  });
  
  
  
  
  
  




module.exports = router;


/*
router.post('/post/feed', justifyToken,  upload.Profile.single('profile'), async (req, res) => { 
    const defaultLimit = parseInt(process.env.DEFAULT_LIMIT) || 10;
    const { page, limit, offset } = getPaginationParams(req.query);  // Get pagination parameters from the request query

    const userId = req.user.id;  // Get the user ID from the token
    if (userId === undefined) {}// non user feed
    else {} // user feed
    });
*/

// bearing
// user_tags
// view_count
// visibility
// postmedia