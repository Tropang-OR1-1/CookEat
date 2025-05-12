// defines.js
const validator = require("validator"); // Import the validator library for email validation
const xss = require("xss");
const db = require('./db');


const logger = require('./logger'); // Import the logger for logging errors
require('dotenv').config({ path: '../.env' }); // Go up 2 levels to load .env
const allowedSex = ['Male', 'Female'];
const allowedNationalities = [
  "Afghan", "Albanian", "Algerian", "American", "Andorran",
  "Angolan", "Argentine", "Armenian", "Australian", "Austrian",
  "Azerbaijani", "Bahamian", "Bahraini", "Bangladeshi", "Barbadian",
  "Belarusian", "Belgian", "Belizean", "Beninese", "Bhutanese",
  "Bolivian", "Bosnian", "Botswanan", "Brazilian", "British",
  "Bruneian", "Bulgarian", "Burkinabé", "Burmese", "Burundian",
  "Cambodian", "Cameroonian", "Canadian", "Cape Verdean", "Central African",
  "Chadian", "Chilean", "Chinese", "Colombian", "Comorian",
  "Congolese", "Costa Rican", "Croatian", "Cuban", "Cypriot",
  "Czech", "Danish", "Djiboutian", "Dominican", "Dutch",
  "Ecuadorian", "Egyptian", "Emirati", "English", "Equatorial Guinean",
  "Eritrean", "Estonian", "Ethiopian", "Fijian", "Finnish",
  "French", "Gabonese", "Gambian", "Georgian", "German",
  "Ghanaian", "Greek", "Grenadian", "Guatemalan", "Guinean",
  "Guyanese", "Haitian", "Honduran", "Hungarian", "Icelandic",
  "Indian", "Indonesian", "Iranian", "Iraqi", "Irish",
  "Israeli", "Italian", "Ivorian", "Jamaican", "Japanese",
  "Jordanian", "Kazakh", "Kenyan", "Kuwaiti", "Kyrgyz",
  "Lao", "Latvian", "Lebanese", "Liberian", "Libyan",
  "Lithuanian", "Luxembourgish", "Macedonian", "Malagasy", "Malawian",
  "Malaysian", "Maldivian", "Malian", "Maltese", "Marshallese",
  "Mauritanian", "Mauritian", "Mexican", "Micronesian", "Moldovan",
  "Monegasque", "Mongolian", "Montenegrin", "Moroccan", "Mozambican",
  "Namibian", "Nepalese", "New Zealander", "Nicaraguan", "Nigerian",
  "Nigerien", "North Korean", "Norwegian", "Omani", "Pakistani",
  "Palauan", "Palestinian", "Panamanian", "Papua New Guinean", "Paraguayan",
  "Peruvian", "Filipino", "Polish", "Portuguese", "Qatari",
  "Romanian", "Russian", "Rwandan", "Saint Lucian", "Salvadoran",
  "Samoan", "Saudi", "Scottish", "Senegalese", "Serbian",
  "Seychellois", "Sierra Leonean", "Singaporean", "Slovak", "Slovenian",
  "Somali", "South African", "South Korean", "Spanish", "Sri Lankan",
  "Sudanese", "Surinamese", "Swazi", "Swedish", "Swiss",
  "Syrian", "Taiwanese", "Tajik", "Tanzanian", "Thai",
  "Togolese", "Tongan", "Trinidadian", "Tunisian", "Turkish",
  "Turkmen", "Tuvaluan", "Ugandan", "Ukrainian", "Uruguayan",
  "Uzbek", "Venezuelan", "Vietnamese", "Welsh", "Yemeni",
  "Zambian", "Zimbabwean"
      ];

const allowedStatus = ['public', 'private', 'restricted'];
const allowedReactions = ['UP', 'NEUTRAL', 'DOWN'];
const allowedDeleteMedia = ['image', 'video', 'all'];
const allowedRecipeDifficulty = ['easy', 'medium', 'hard'];


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

const stringArrayParser = (tags) => {
  if (typeof tags === 'string') {
      try {
          const fixedString = tags.replace(/'/g, '"'); // Replace single quotes with double quotes
          return JSON.parse(fixedString); // Try to parse the JSON string
      } catch {
          return undefined; // Return empty array if parsing fails
      }
  } else if (Array.isArray(tags)) {
      return tags;
  } else {
      return undefined; // Return empty array if input is not string or array
  }
};


const validateArrayInput = (input, { maxLength = 50, minItems = 1, maxItems = 20, itemType = 'string' } = {}) => {
  // Use stringArrayParser to handle cases where input might be a stringified array
  const parsedInput = stringArrayParser(input);

  // If parsing fails or the result is not an array, return an error
  if (!Array.isArray(parsedInput)) {
      return { success: false, error: 'Input should be a valid array.' };
  }

  // Check if array is not empty (based on minItems)
  if (parsedInput.length < minItems) {
      return { success: false, error: `Array should contain at least ${minItems} item(s) or improper parsing format.` };
    } else 
  if (parsedInput.length > maxItems) {
      return { success: false, error: `Array should contain no more than ${maxItems} item(s).` };
  }

  // Sanitize input by applying sanitizedInput to each item
  const sanitizedInput = parsedInput.map(item => sanitizeInput(item));

  // Validate each item in the array
  const isValid = sanitizedInput.every(item => {
      // Check type
      if (typeof item !== itemType) return false;

      // Check max length for strings
      if (itemType === 'string' && item.length > maxLength) return false;

      return true;
  });

  // If any validation fails
  if (!isValid) {
      return { success: false, error: `Each item should be a ${itemType} and within the allowed length of ${maxLength} characters.` };
  }

  // Return success if valid
  return { success: true, data: sanitizedInput };
};



const queryStatus = async (userId) => { // -> fetch status
  try {
    const { rows } = await db.query("SELECT status FROM user_profile WHERE id = $1", [userId]);
    return rows.length ? { success: true, status: rows[0].status } : { success: false, error: 'User not found' };
    } catch {
      return { success: false, error: 'Database error' };
    }
  };

const queryPPID = async (public_id) => { // query post public ID -> post id
  try {
    const { rows } = await db.query("SELECT id FROM posts WHERE public_id = $1", [public_id]);
    return rows.length ? { success: true, id: rows[0].id } : { success: false, error: 'post\'s not found' };
    } catch (err) {
      logger.error(err); // Log the error for debugging
      return { success: false, error: 'Database error' };
    }
  };

const queryCPID = async (public_id) => { // query comment public ID -> comment id
    try {
      const { rows } = await db.query("SELECT id FROM comments WHERE public_id = $1", [public_id]);
      return rows.length ? { success: true, id: rows[0].id } : { success: false, error: 'comment\'s not found' };
      } catch (err) {
        logger.error(err); // Log the error for debugging
        return { success: false, error: 'Database error' };
      }
    };  

const queryRPID = async (public_id) => { // query recipe public ID -> recipe id
    try {
      const { rows } = await db.query("SELECT id FROM recipe WHERE public_id = $1", [public_id]);
      return rows.length ? { success: true, id: rows[0].id } : { success: false, error: 'recipe not found' };
      } catch (err) {
        logger.error(err); // Log the error for debugging
        return { success: false, error: 'Database error' };
      }
    };

const queryPostUID = async (post_id) => { // requires primary post id
  try {
    const { rows } = await db.query("SELECT user_id FROM posts WHERE public_id = $1", [post_id]);
    return rows.length ? { success: true, user_id: rows[0].user_id } : { success: false, error: 'user\'s not found' };
    } catch (err) {
      logger.error(err); // Log the error for debugging
      return { success: false, error: 'Database error' };
    }
}

const queryUPID = async (user_public_id) => { // query user public id
  try {
    if (!isValidUUID(user_public_id)) return { success: false, error: 'user_id must be a valid UUID.' };
    
    const { rows } = await db.query("SELECT id FROM user_profile WHERE public_id = $1", [user_public_id]);
    return rows.length ? { success: true, user_id: rows[0].id } : { success: false, error: 'user not found' };
    } catch (err) {
        logger.error(`Error executing queryUPID (${user_public_id}): ${err.stack}`);
        return { success: false, error: 'Database error' };
    }
}

const isValidUUID = (str) => /^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$/.test(str);


const hasUploadedFiles = (files) => {
  return Array.isArray(files) && files.length > 0;
  };

  const sanitizeInput = (dirty) => {
    try {
      return xss(dirty);
    } catch (err) {
      logger.error(err); // Log the error for debugging
      return dirty; // Return the original input if something goes wrong
    }
  };

const isAlphanumeric = (str) => typeof str === 'undefined' || typeof str === 'string' && /^[A-Za-z0-9_]+$/.test(str);



async function canAccessUserData(accId, userId) {
  try {
      const query = `
          SELECT status
          FROM user_profile
          WHERE id = $1
      `;
      const { rows } = await db.query(query, [userId]);
      
      if (!rows.length)
          return { success: false, error: "User not found." };

      const status = rows[0].status; // 'private', 'restricted', or 'public'

      if (status === 'public')
          return { success: true };

      if (status === 'private') {
          if (accId === userId)
              return { success: true };
          else
              return { success: false, error: "Private account." };
      }

      if (status === 'restricted') {
          if (accId === userId)
              return { success: true };

          const followQuery = `
              SELECT 1
              FROM followers AS f1
              JOIN followers AS f2
                ON f1.following_user_id = f2.follower_user_id
               AND f1.follower_user_id = f2.following_user_id
              WHERE f1.following_user_id = $1
                AND f1.follower_user_id = $2
              LIMIT 1
          `;
          const { rows: followRows } = await db.query(followQuery, [userId, accId]);
          
          if (followRows.length)
              return { success: true };
          else
              return { success: false, error: "Restricted account. Only mutual followers can access." };
      }

      return { success: false, error: "Invalid account status." };
  } catch (err) {
      logger.error(err); // Log the error for debugging
      return { success: false, error: "Database error." };
      }
  }

  function getPaginationParams(reqQuery, defaultLimit = 10) {
    let page = parseInt(reqQuery.page, 10) || 1;
    if (isNaN(page) || page < 0) page = 1;

    const limit = parseInt(reqQuery.limit, 10) || defaultLimit;
    const offset = (page - 1) * limit;

    return { page, limit, offset };
}


module.exports = {
  sanitizeInput,
  isAlphanumeric,
  isValidUUID,
  allowedSex,
  allowedNationalities,
  allowedStatus,
  allowedRecipeDifficulty,
  allowedReactions,
  allowedDeleteMedia,
  usernameRegex,
  allowedMediaTypes,
  allowedImageTypes,
  canAccessUserData,
  hasUploadedFiles,
  emailValidator,
  tagsValidator,
  validateArrayInput,
  stringArrayParser,
  queryPostUID,
  queryStatus,
  queryPPID,
  queryCPID,
  queryRPID,
  queryUPID,
  getPaginationParams
};
