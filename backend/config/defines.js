// defines.js
const validator = require("validator"); // Import the validator library for email validation
const xss = require("xss");
const db = require('./db');

const allowedStatus = ['public', 'private', 'restricted'];
const allowedReactions = ['UP', 'NEUTRAL', 'DOWN'];

const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;

const allowedMediaTypes = ['.mp4', '.avi', '.mov', '.mkv', '.webm', '.jfif'];
const allowedImageTypes = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];


const emailValidator = (email) => { return validator.isEmail(email); }

const tagsValidator = (tags) => {
  if (tags === undefined || !Array.isArray(tags)) {
    return false;
  }
  // Sanitize each tag to prevent XSS
  const sanitizedTags = tags.map(tag => xss(tag));
  // Check if every tag is a string after sanitization
  return sanitizedTags.every(tag => typeof tag === 'string');
};

const tagsNormalize = (tags) => {
    if (typeof tags === 'string') {
      try { return JSON.parse(tags.replace(/'/g, '"')); }
      catch (err) { return undefined; }
      }
    else if (Array.isArray(tags)) { return tags; } 
    else { return undefined; }
    };

const queryStatus = async (userId) => {
  try {
    const { rows } = await db.query("SELECT status FROM user_profile WHERE id = $1", [userId]);
    return rows.length ? { success: true, status: rows[0].status } : { success: false, error: 'User not found' };
    } catch (err) {
      return { success: false, error: 'Database error' };
    }
  };

const queryPPID = async (public_id) => { // query post public ID
  try {
    const { rows } = await db.query("SELECT id FROM posts WHERE public_id = $1", [public_id]);
    return rows.length ? { success: true, id: rows[0].id } : { success: false, error: 'post\'s not found' };
    } catch (err) {
      return { success: false, error: 'Database error' };
    }
  };

const queryCPID = async (public_id) => { // query comment public ID
    try {
      const { rows } = await db.query("SELECT id FROM comments WHERE public_id = $1", [public_id]);
      return rows.length ? { success: true, id: rows[0].id } : { success: false, error: 'comment\'s not found' };
      } catch (err) {
        return { success: false, error: 'Database error' };
      }
    };  

const fetchPostOwner = async (post_id) => { // requires primary post id
  try {
    const { rows } = await db.query("SELECT user_id FROM posts WHERE id = $1", [post_id]);
    return rows.length ? { success: true, user_id: rows[0].user_id } : { success: false, error: 'user\'s not found' };
    } catch (err) {
      return { success: false, error: 'Database error' };
    }
}

const isUserConnected = async (userA_id, userB_id) => {
  try {
    // Query to check if userA follows userB and userB follows userA
    const query = `
      SELECT EXISTS (
        SELECT 1
        FROM public.followers f1
        WHERE f1.following_user_id = $1
          AND f1.followed_user_id = $2
      ) AS userA_follows_userB,
      
      EXISTS (
        SELECT 1
        FROM public.followers f2
        WHERE f2.following_user_id = $2
          AND f2.followed_user_id = $1
      ) AS userB_follows_userA;
    `;
    
    const res = await db.query(query, [userA_id, userB_id]);
    
    // Check if both conditions are true (both users follow each other)
    const isConnected = res.rows[0].userA_follows_userB && res.rows[0].userB_follows_userA;
    return { success: true, isConnected: isConnected };  // returns true if both follow each other, false otherwise
  } catch (err) {
    console.error('Error checking user connection:', err);
    return { success : false, error: 'Failed to check connection.' };  // failure response
  }
};

const isvalidtitleLength = (title) => { return title.length <= 255; }
const isValidUUID = (str) => /^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$/.test(str);


const hasUploadedFiles = (files) => {
  return Array.isArray(files) && files.length > 0;
  };

  const sanitizeInput = (dirty) => {
    try {
      return xss(dirty);
    } catch (err) {
      console.error("Error sanitizing input:", err);
      return dirty; // Return the original input if something goes wrong
    }
  };

  const isAlphanumeric = (str) => typeof str === 'undefined' || typeof str === 'string' && /^[A-Za-z0-9_]+$/.test(str);



module.exports = {
  sanitizeInput,
  isAlphanumeric,
  isValidUUID,
  allowedStatus,
  allowedReactions,
  usernameRegex,
  allowedMediaTypes,
  allowedImageTypes,
  isvalidtitleLength,
  isUserConnected,
  hasUploadedFiles,
  emailValidator,
  tagsValidator,
  tagsNormalize,
  fetchPostOwner,
  queryStatus,
  queryPPID,
  queryCPID
};
