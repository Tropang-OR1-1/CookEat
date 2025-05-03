
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
  const { page, limit, offset } = getPaginationParams(req.query, defaultLimit);
  const userId = req.user?.id;

  try {
      let queryParams = [limit, offset];
      let countParams = [];

      if (userId) {
          queryParams.push(userId);
          countParams.push(userId);
      }

      const query = `
          SELECT 
              p.public_id, 
              p.title, 
              p.content, 
              p.view_count, 
              p.created_at, 
              p.updated_at,
              COALESCE(json_agg(
                  json_build_object(
                      'media_filename', postmedia.fname,
                      'media_type', postmedia.media_type
                  )
              ) FILTER (WHERE postmedia.fname IS NOT NULL), '[]') AS media,
              COUNT(DISTINCT pr.user_id) AS reactions_count,
              r.public_id AS ref_public_id,
              u.public_id AS author_public_id,
              u.username AS author_username,
              u.picture AS author_picture
          FROM posts p
          LEFT JOIN postmedia ON postmedia.post_id = p.id
          LEFT JOIN post_reaction pr ON pr.post_id = p.id
          LEFT JOIN post_tags pt ON pt.post_id = p.id
          LEFT JOIN tags t ON t.id = pt.tags_id
          LEFT JOIN user_profile u ON p.user_id = u.id
          ${userId ? `LEFT JOIN user_tags ut ON ut.user_id = $3 AND ut.tags_id = t.id` : ''}
          LEFT JOIN posts r ON r.id = p.ref_id
          WHERE (p.visibility = 'public'
              ${userId ? `OR (p.visibility = 'private' AND p.user_id = $3)
                         OR (p.visibility = 'restricted' AND EXISTS 
                             (SELECT 1 FROM followers f 
                              WHERE f.following_user_id = p.user_id 
                              AND f.follower_user_id = $3))` : ''}
          )
          GROUP BY p.id, r.public_id, u.public_id, u.username, u.picture
          ORDER BY p.created_at DESC, p.view_count DESC
          LIMIT $1 OFFSET $2
      `;

      const countQuery = `
          SELECT COUNT(DISTINCT p.id) AS total
          FROM posts p
          LEFT JOIN post_tags pt ON pt.post_id = p.id
          LEFT JOIN tags t ON t.id = pt.tags_id
          ${userId ? `LEFT JOIN user_tags ut ON ut.user_id = $1 AND ut.tags_id = t.id` : ''}
          WHERE (p.visibility = 'public'
              ${userId ? `OR (p.visibility = 'private' AND p.user_id = $1)
                         OR (p.visibility = 'restricted' AND EXISTS 
                             (SELECT 1 FROM followers f 
                              WHERE f.following_user_id = p.user_id 
                              AND f.follower_user_id = $1))` : ''}
          )
      `;

      const posts = await db.query(query, queryParams);
      const countResult = await db.query(countQuery, countParams);
      const totalPosts = parseInt(countResult.rows[0]?.total || '0');

      const formattedPosts = posts.rows.map(post => ({
          public_id: post.public_id,
          title: post.title,
          content: post.content,
          view_count: post.view_count,
          created_at: post.created_at,
          updated_at: post.updated_at,
          media: post.media,
          reactions_count: post.reactions_count,
          ref_public_id: post.ref_public_id,
          author: {
              public_id: post.author_public_id,
              username: post.author_username,
              picture: post.author_picture
          }
      }));

      const hasNext = offset + limit < totalPosts;
      const hasPrev = page > 1;

      res.status(200).json({
          pagination: {
              page,
              limit,
              total: totalPosts,
              hasNext,
              hasPrev
            },
            posts: formattedPosts
      });
  } catch (error) {
      console.error('Error fetching posts:', error);
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


router.get('/feed/recipe', justifyToken, async (req, res) => {
  try {
      const defaultLimit = parseInt(process.env.DEFAULT_LIMIT) || 10;
      const { page, limit, offset } = getPaginationParams(req.query, defaultLimit);
      const userId = req.user?.id || null;
      const sort = req.query.sort || 'created_at';

      let orderClause = `r.created_at DESC`;
      if (sort === 'rating') {
          orderClause = `avg_rating DESC NULLS LAST, r.created_at DESC`;
      } else if (sort === 'following' && userId) {
          orderClause = `(f.follower_user_id IS NOT NULL) DESC, r.created_at DESC`;
      }

      const recipesQuery = `
          WITH rating_avg AS (
              SELECT recipe_id, AVG(rating) AS avg_rating
              FROM recipe_rating
              GROUP BY recipe_id
          ),
          media_grouped AS (
              SELECT 
                  rm.recipe_id,
                  jsonb_agg(
                      jsonb_build_object(
                          'url', rm.fname,
                          'type', rm.media_type,
                          'number', rm.number
                      ) ORDER BY rm.number
                  ) AS media
              FROM recipemedia rm
              GROUP BY rm.recipe_id
          )
          SELECT
              r.public_id,
              r.title,
              r.description,
              r.view_count,
              r.created_at,
              r.updated_at,
              r.prep_time,
              r.cook_time,
              r.servings,
              r.difficulty,
              r.steps,
              COALESCE(ra.avg_rating, 0) AS avg_rating,
              jsonb_build_object(
                  'username', u.username,
                  'public_id', u.public_id,
                  'picture', u.picture
              ) AS author,
              COALESCE(mg.media, '[]') AS media
          FROM recipe r
          JOIN user_profile u ON u.id = r.author_id
          LEFT JOIN rating_avg ra ON ra.recipe_id = r.id
          LEFT JOIN media_grouped mg ON mg.recipe_id = r.id
          LEFT JOIN followers f ON f.following_user_id = r.author_id AND f.follower_user_id = $1
          ORDER BY ${orderClause}
          LIMIT $2 OFFSET $3
      `;

      const totalQuery = `
          SELECT COUNT(*) AS total
          FROM recipe r
          LEFT JOIN followers f ON f.following_user_id = r.author_id AND f.follower_user_id = $1
      `;

      const [{ rows: recipes }, { rows }] = await Promise.all([
          db.query(recipesQuery, [userId, limit, offset]),
          db.query(totalQuery, [userId])
      ]);

      const total = parseInt(rows[0].total, 10);
      const totalPages = Math.ceil(total / limit);
      const hasNext = page < totalPages;
      const hasPrev = page > 1;

      res.status(200).json({
          pagination: {
              page,
              limit,
              total,
              hasNext,
              hasPrev
          },
          recipes
      });
  } catch (err) {
      console.error('Error fetching feed:', err);
      res.status(500).json({ error: 'Internal server error' });
  }
});




router.get('/recipes/author/:public_id', justifyToken, upload.none(), async (req, res) => {
  try {
      const defaultLimit = parseInt(process.env.DEFAULT_LIMIT) || 10;
      const { page, limit, offset } = getPaginationParams(req.query, defaultLimit);
      const { public_id } = req.params;
      const sort = req.query.sort || 'created_at';

      // Get internal user ID from public_id
      const userResult = await db.query(
          `SELECT id, username, picture FROM user_profile WHERE public_id = $1`,
          [public_id]
      );

      if (userResult.rowCount === 0) {
          return res.status(404).json({ error: 'Author not found' });
      }

      const authorId = userResult.rows[0].id;
      const authorInfo = {
          public_id,
          username: userResult.rows[0].username,
          picture: userResult.rows[0].picture
      };

      let orderClause = `r.created_at DESC`;
      if (sort === 'rating') {
          orderClause = `avg_rating DESC NULLS LAST, r.created_at DESC`;
      }

      const recipesQuery = `
          WITH rating_avg AS (
              SELECT recipe_id, AVG(rating) AS avg_rating
              FROM recipe_rating
              GROUP BY recipe_id
          ),
          media_grouped AS (
              SELECT 
                  recipe_id,
                  jsonb_agg(
                      jsonb_build_object(
                          'fname', fname,
                          'type', media_type,
                          'number', number
                      ) ORDER BY number
                  ) AS media
              FROM recipemedia
              GROUP BY recipe_id
          )
          SELECT
              r.public_id,
              r.title,
              r.description,
              r.view_count,
              r.created_at,
              r.updated_at,
              r.prep_time,
              r.cook_time,
              r.servings,
              r.difficulty,
              r.steps,
              COALESCE(ra.avg_rating, 0) AS avg_rating,
              COALESCE(mg.media, '[]') AS media
          FROM recipe r
          LEFT JOIN rating_avg ra ON ra.recipe_id = r.id
          LEFT JOIN media_grouped mg ON mg.recipe_id = r.id
          WHERE r.author_id = $1
          ORDER BY ${orderClause}
          LIMIT $2 OFFSET $3
      `;

      const totalQuery = `
          SELECT COUNT(*) AS total
          FROM recipe
          WHERE author_id = $1
      `;

      const [{ rows: recipes }, { rows }] = await Promise.all([
          db.query(recipesQuery, [authorId, limit, offset]),
          db.query(totalQuery, [authorId])
      ]);

      const total = parseInt(rows[0].total, 10);
      const totalPages = Math.ceil(total / limit);
      const hasNext = page < totalPages;
      const hasPrev = page > 1;

      res.status(200).json({
          author: authorInfo,
          pagination: {
              page,
              limit,
              total,
              hasNext,
              hasPrev
          },
          recipes
      });
  } catch (err) {
      console.error('Error fetching author recipes:', err);
      res.status(500).json({ error: 'Internal server error' });
  }
});



router.get('/posts/owner/:public_id', justifyToken, upload.none(), async (req, res) => {
  const defaultLimit = parseInt(process.env.DEFAULT_LIMIT) || 10;
  const { page, limit, offset } = getPaginationParams(req.query, defaultLimit);
  const sort = req.query.sort || 'created_at';
  const authorPublicId = req.params.public_id;

  let orderClause = `p.created_at DESC`;

  if (sort === 'views') {
      orderClause = `p.view_count DESC NULLS LAST, p.created_at DESC`;
  } else if (sort === 'updated_at') {
      orderClause = `p.updated_at DESC`;
  }

  try {
      const query = `
          SELECT 
              p.public_id, 
              p.title, 
              p.content, 
              p.view_count, 
              p.created_at, 
              p.updated_at,
              COALESCE(json_agg(
                  json_build_object(
                      'fname', postmedia.fname,
                      'type', postmedia.media_type
                  )
              ) FILTER (WHERE postmedia.fname IS NOT NULL), '[]') AS media,
              COUNT(DISTINCT pr.user_id) AS reactions_count,
              r.public_id AS ref_public_id,
              u.public_id AS author_public_id,
              u.username AS author_username,
              u.picture AS author_picture
          FROM posts p
          LEFT JOIN user_profile u ON p.user_id = u.id
          LEFT JOIN postmedia ON postmedia.post_id = p.id
          LEFT JOIN post_reaction pr ON pr.post_id = p.id
          LEFT JOIN posts r ON r.id = p.ref_id
          WHERE u.public_id = $3
          GROUP BY p.id, r.public_id, u.public_id, u.username, u.picture
          ORDER BY ${orderClause}
          LIMIT $1 OFFSET $2
      `;

      const countQuery = `
          SELECT COUNT(*) AS total
          FROM posts p
          LEFT JOIN user_profile u ON p.user_id = u.id
          WHERE u.public_id = $1
      `;

      const postsResult = await db.query(query, [limit, offset, authorPublicId]);
      const countResult = await db.query(countQuery, [authorPublicId]);
      const totalPosts = parseInt(countResult.rows[0]?.total || '0');
      const rows = postsResult.rows;

      if (rows.length === 0) {
          return res.status(200).json({
              pagination: {
                  page,
                  limit,
                  total: 0,
                  hasNext: false,
                  hasPrev: false
              },
              owner: null,
              posts: []
          });
      }

      const formattedPosts = rows.map(post => ({
          public_id: post.public_id,
          title: post.title,
          content: post.content,
          view_count: post.view_count,
          created_at: post.created_at,
          updated_at: post.updated_at,
          media: Array.isArray(post.media) ? post.media : [],
          reactions_count: post.reactions_count,
          ref_public_id: post.ref_public_id
      }));

      const hasNext = offset + limit < totalPosts;
      const hasPrev = page > 1;

      res.status(200).json({
          owner: {
            public_id: rows[0].author_public_id,
            username: rows[0].author_username,
            picture: rows[0].author_picture
            },
          pagination: {
              page,
              limit,
              total: totalPosts,
              hasNext,
              hasPrev
          },
          posts: formattedPosts
      });
  } catch (error) {
      console.error('Error fetching user posts:', error);
      res.status(500).json({ message: 'An error occurred while fetching user posts.' });
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