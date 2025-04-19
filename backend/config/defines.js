// defines.js
const validator = require("validator"); // Import the validator library for email validation
const xss = require("xss");
const db = require('./db');

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
      } catch (err) {
          return undefined; // Return empty array if parsing fails
      }
  } else if (Array.isArray(tags)) {
      return tags;
  } else {
      return undefined; // Return empty array if input is not string or array
  }
};


const validateArrayInput = (input, { maxLength = 500, minItems = 1, itemType = 'string' } = {}) => {
  // Use stringArrayParser to handle cases where input might be a stringified array
  const parsedInput = stringArrayParser(input);

  // If parsing fails or the result is not an array, return an error
  if (!Array.isArray(parsedInput)) {
      return { success: false, error: 'Input should be a valid array.' };
  }

  // Check if array is not empty (based on minItems)
  if (parsedInput.length < minItems) {
      return { success: false, error: `Array should contain at least ${minItems} item(s) or improper parsing format.` };
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
    } catch (err) {
      return { success: false, error: 'Database error' };
    }
  };

const queryPPID = async (public_id) => { // query post public ID -> post id
  try {
    const { rows } = await db.query("SELECT id FROM posts WHERE public_id = $1", [public_id]);
    return rows.length ? { success: true, id: rows[0].id } : { success: false, error: 'post\'s not found' };
    } catch (err) {
      return { success: false, error: 'Database error' };
    }
  };

const queryCPID = async (public_id) => { // query comment public ID -> comment id
    try {
      const { rows } = await db.query("SELECT id FROM comments WHERE public_id = $1", [public_id]);
      return rows.length ? { success: true, id: rows[0].id } : { success: false, error: 'comment\'s not found' };
      } catch (err) {
        return { success: false, error: 'Database error' };
      }
    };  

const queryRPID = async (public_id) => { // query recipe public ID -> recipe id
    try {
      const { rows } = await db.query("SELECT id FROM recipe WHERE public_id = $1", [public_id]);
      return rows.length ? { success: true, id: rows[0].id } : { success: false, error: 'recipe not found' };
      } catch (err) {
        return { success: false, error: 'Database error' };
      }
    };

const queryPostUID = async (post_id) => { // requires primary post id
  try {
    const { rows } = await db.query("SELECT user_id FROM posts WHERE public_id = $1", [post_id]);
    return rows.length ? { success: true, user_id: rows[0].user_id } : { success: false, error: 'user\'s not found' };
    } catch (err) {
      console.log(err);
      return { success: false, error: 'Database error' };
    }
}

const isMutualFollow = async (userA_id, userB_id) => {
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
  allowedSex,
  allowedNationalities,
  allowedStatus,
  allowedRecipeDifficulty,
  allowedReactions,
  allowedDeleteMedia,
  usernameRegex,
  allowedMediaTypes,
  allowedImageTypes,
  isMutualFollow,
  hasUploadedFiles,
  emailValidator,
  tagsValidator,
  validateArrayInput,
  stringArrayParser,
  queryPostUID,
  queryStatus,
  queryPPID,
  queryCPID,
  queryRPID
};
