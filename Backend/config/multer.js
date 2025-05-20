const multer = require('multer');
require('dotenv').config({ path: '../.env' });

const { allowedMediaTypes, allowedImageTypes } = require('./defines');
const path = require('path');

const { v4: uuidv4 } = require('uuid');

/*
const storageProfile = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, process.env.PROFILE_DIR);  // Folder to save the uploaded files
    },  
    filename: (req, file, cb) => {
        const fileExtension = file.mimetype.split('/')[1]; // Get the file extension
        const randomString = uuidv4();  // Generate random string
        cb(null, `${randomString}.${fileExtension}`);  // Name file by random string and timestamp
    }
});

// Multer setup for Profile upload
const Profile = multer({
    storage: storageProfile,
    fileFilter: fileFilterImage,
    limits: { fileSize: process.env.PROFILE_MAX_SIZE }  // Dynamic file size limit from .env
});
*/

// File filter to only allow specific file types
const fileFilterImage = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.mimetype)) {
        return cb(new Error('Invalid file type. Only JPG, PNG are allowed.'));
    }
    cb(null, true);
};







//
const storageUserMedia = multer.memoryStorage();

const userMedia = multer({
    storage: storageUserMedia,
    fileFilter: fileFilterImage,
    limits: { fileSize: process.env.USERMEDIA_MAX_SIZE }  // Dynamic file size limit from .env
});

//


const storageMedia = multer.memoryStorage();  // Store files in memory

  // File filter for images and videos
const fileFilterMedia = (req, file, cb) => {
    const allowedmimetypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4'];
    const extname = path.extname(file.originalname).toLowerCase(); // Get the file extension

    if (allowedmimetypes.includes(file.mimetype) || allowedImageTypes.includes(extname) || allowedMediaTypes.includes(extname)) {
      cb(null, true); // Accept image/video file
    } else {
      cb(
        new Error('Invalid file type. Only JPEG, PNG, GIF, MP4, AVI, MOV, MKV, and WEBM are allowed for posts'),
        false); // Reject file
    }
  };

const Media = multer({
    storage: storageMedia,
    fileFilter: fileFilterMedia,
    limits: { fileSize: process.env.MEDIA_MAX_SIZE } // Max file size of 10MB
  });

///<-------------------------------- >

const storageRecipeSteps = multer.memoryStorage();

// Multer setup for Recipe file upload
/*
const recipeSteps = multer({
  storage: storageRecipeSteps,
  fileFilter: fileFilterMedia,
  limits: { 
      fileSize: process.env.RECIPE_MAX_SIZE // Dynamic file size limit from .env
  }
});
*/
// ---------- Thumbnail Storage and Filter ---------- //
const storageThumbnail = multer.diskStorage({
  destination: (req, file, cb) => {
    // Use environment variable for dynamic folder location for thumbnails
    cb(null, process.env.RECIPE_THUMBNAIL_DIR);
  },
  filename: (req, file, cb) => {
    const fileExtension = file.mimetype.split('/')[1]; // Get the file extension (e.g., jpg, png)
    const randomString = uuidv4();  // Generate a random string for unique file name
    cb(null, `${randomString}.${fileExtension}`);  // Save file with random string as the name
  }
});

/*
// Thumbnail upload setup with dynamic max file size from .env
const recipeThumbnail = multer({
  storage: storageThumbnail,
  fileFilter: fileFilterImage,
  limits: { 
    fileSize: process.env.THUMBNAIL_MAX_SIZE || 2 * 1024 * 1024  // Default 2MB for thumbnails
  }
});
*/
//// <<<-------------NONE-------------- >>>>>


const none = () => {
  return multer({
      storage: multer.memoryStorage(),
      fileFilter: (req, file, cb) => {
          // Reject any file uploads explicitly
          return cb(null, false);
      },
      limits: { fileSize: 0 }  // Enforce no file uploads
  }).none();  // Specifically use `none()` to handle only non-file data
};



//??? <<<combined>>>>></>


// --- Combined multer for /recipe/create route only ---
const combinedRecipeUpload = multer({
  storage: {
    _handleFile(req, file, cb) {
      if (file.fieldname === 'thumbnail') {
        return storageThumbnail._handleFile(req, file, cb);
      } else if (file.fieldname === 'media') {
        return storageRecipeSteps._handleFile(req, file, cb);
      } else {
        return cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', file.fieldname));
      }
    },
    _removeFile(req, file, cb) {
      if (file.fieldname === 'thumbnail') {
        return storageThumbnail._removeFile(req, file, cb);
      } else if (file.fieldname === 'media') {
        return storageRecipeSteps._removeFile(req, file, cb);
      } else {
        cb(null);
      }
    }
  },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'thumbnail') {
      return fileFilterImage(req, file, cb);
    } else if (file.fieldname === 'media') {
      return fileFilterMedia(req, file, cb);
    } else {
      return cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', file.fieldname));
    }
  },
  limits: {
    fileSize: parseInt(process.env.RECIPE_MAX_SIZE) || 5 * 1024 * 1024 // fallback 5MB per file
  }
});




module.exports = {userMedia, Profile, Media, combinedRecipeUpload, none};
