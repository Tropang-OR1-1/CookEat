const multer = require('multer');
require('dotenv').config({ path: '../.env' });

// Define storage location and file naming convention
const generateRandomString = () => Math.random().toString(36).substring(2, 10); // Generate random string of 8 characters

// Define storage location and file naming convention
const storageProfile = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, process.env.PROFILE_DIR);  // Folder to save the uploaded files
    },
    filename: (req, file, cb) => {
        const fileExtension = file.mimetype.split('/')[1]; // Get the file extension
        const randomString = generateRandomString();  // Generate random string
        cb(null, `${randomString}_${Date.now()}.${fileExtension}`);  // Name file by random string and timestamp
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
    limits: { fileSize: 5 * 1024 * 1024 }  // Limit file size to 5MB
});

// ---------------------------------- //---------------------------------- //

const storageMedia = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'uploads/'); // Directory to store the uploaded files
    },
    filename: (req, file, cb) => {
      cb(null, Date.now() + path.extname(file.originalname)); // Create unique filenames
    }
  });
  
  // File filter for images and videos
  const fileFilterMedia = (req, file, cb) => {
    const allowedMediaTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4'];
    if (allowedMediaTypes.includes(file.mimetype)) {
      cb(null, true); // Accept image/video file
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and MP4 are allowed for posts'), false); // Reject file
    }
  };

const Media = multer({
    storage: storageMedia,
    fileFilter: fileFilterMedia,
    limits: { fileSize: 10 * 1024 * 1024 } // Max file size of 10MB
  });

module.exports = {Profile, Media};
