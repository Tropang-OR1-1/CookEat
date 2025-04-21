// imageRoute.js
require("dotenv").config({ path: "../.env" });
const {verifyMedia} = require('../config/jwt'); // Import JWT verification middleware
const path = require('path');
const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
// Secret key for signing JWT

const { isValidUUID, allowedMediaTypes, allowedImageTypes } = require('../config/defines');

// Middleware for token verification and image serving
router.get('/:type/:fname', async (req, res) => {
    const { type, fname } = req.params;
    const AllowedType = ["profile", "posts", "recipe", "rating", "thumbnail"];

    const [uuid, extension] = fname.split(/\.(?=[^.]+$)/); // split on last dot only
    const ext = `.${extension}`;


    if (!AllowedType.includes(type))
        return res.status(400).json({ error: 'Route not found.' });

    if (!isValidUUID(uuid))
        return res.status(400).json({ error: 'Invalid filename.' });

    if (!allowedMediaTypes.includes(ext) && !allowedImageTypes.includes(ext)){
        console.log(ext);
        return res.status(404).json({ error: 'Invalid file extension.' });
        }

    let FileDir;
    if (type === "posts" || type === "recipe") {
        FileDir = allowedImageTypes.includes(ext)
            ? (type === "posts" ? process.env.POST_IMAGE_DIR : process.env.RECIPE_IMAGE_DIR)
            : (type === "posts" ? process.env.POST_VIDEO_DIR : process.env.RECIPE_VIDEO_DIR);
    } else if (type === "profile") {
        FileDir = process.env.PROFILE_DIR;
    } else if (type === "rating") {
        FileDir = process.env.RECIPE_RATING_MEDIA_DIR;
    } else if (type === "thumbnail") {
        FileDir = process.env.RECIPE_THUMBNAIL_DIR;
    } else {
        console.log(type);
        return res.status(404).json({ error: 'Route not found.' });
    }

    const filePath = path.join(__dirname, '..', FileDir, fname);
    console.log(filePath);
    try {
        await fs.access(filePath); // Check if file exists
        res.sendFile(filePath);
    } catch (err) {
        console.log(err);
        res.status(404).json({ error: 'File not found.' });
    }
});

module.exports = router;
