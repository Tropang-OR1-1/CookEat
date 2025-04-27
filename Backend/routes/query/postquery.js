
const upload = require('../../config/multer');  // Import multer configuration
const db = require("../../config/db");
const express = require('express');
const router = express.Router();

const logger = require('../../config/logger');  // Importing the logger
const { justifyToken } = require('../../config/jwt');  // Import JWT verification middleware
const { getPaginationParams, isValidUUID, queryUPID } = require('../../config/defines');  // Import pagination utility
require('dotenv').config({ path: '../.env' });

// bearing
// user_tags
// view_count
// visibility
// postmedia