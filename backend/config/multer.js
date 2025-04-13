const multer = require('multer');
require('dotenv').config({ path: '../.env' });

const { allowedMediaTypes, allowedImageTypes } = require('./defines');
const path = require('path');

const { v4: uuidv4 } = require('uuid');


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


// File filter to only allow specific file types
const fileFilterProfile = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.mimetype)) {
        return cb(new Error('Invalid file type. Only JPG, PNG are allowed.'));
    }
    cb(null, true);
};

// Multer setup for Profile upload
const Profile = multer({
    storage: storageProfile,
    fileFilter: fileFilterProfile,
    limits: { fileSize: process.env.PROFILE_MAX_SIZE }  // Dynamic file size limit from .env
});

/*
  const storageMedia = multer.diskStorage({
    destination: (req, file, cb) => {
      const extname = path.extname(file.originalname).toLowerCase(); // Get file extension and convert to lowercase
      
      // Check file extension and determine the directory
      if (allowedImageTypes.includes(extname)) {
        cb(null, process.env.IMAGE_DIR); // Store images in 'uploads/images/'
      } else if (allowedMediaTypes.includes(extname)) {
        cb(null, process.env.VIDEO_DIR); // Store videos in 'uploads/videos/'
      } else {
        cb(new Error('Invalid file type. Only images and videos are allowed'), false); // Reject non-image/video files
      }
    },
    filename: (req, file, cb) => {
      const fileExtension = file.mimetype.split('/')[1]; // Get the file extension
      const randomString = uuidv4();  // Generate random string
      cb(null, `${randomString}.${fileExtension}`);  // Name file by random string and timestamp
  }
});
*/

const storageMedia = multer.memoryStorage();  // Store files in memory

  // File filter for images and videos
const fileFilterMedia = (req, file, cb) => {
    const allowedmimetypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4'];
    const extname = path.extname(file.originalname).toLowerCase(); // Get the file extension

    if (allowedmimetypes.includes(file.mimetype) || allowedMediaTypes.includes(extname)) {
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

  const none = () => multer().none();

module.exports = {Profile, Media, none};
