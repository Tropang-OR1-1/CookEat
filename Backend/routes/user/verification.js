const nodemailer = require('nodemailer');
const crypto = require('crypto'); // To generate a unique token
const dotenv = require('dotenv').config();
const express = require('express');
const db = require("../../config/db");

const upload = require('../../config/multer');  // Import multer configuration
const logger = require('../../config/logger');

const router = express.Router();
// Example function to send verification email
async function sendVerificationEmail(userEmail, verificationToken) {

    // Create a transporter (using Gmail in this case)
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: `${process.env.COOKEAT_GMAIL}`},
            pass: `${process.env.COOKEAT_GMAIL_PASSWD}` // Use environment variables in production
        });

    const verificationLink = `https://yourdomain.com/verify-email?token=${verificationToken}`;

    // Email options
    let mailOptions = {
        from: `${process.env.COOKEAT_GMAIL}`,
        to: userEmail,
        subject: 'Please verify your email address',
        text: `Click the following link to verify your email: ${verificationLink}`
    };

    // Send email
    try {
        await transporter.sendMail(mailOptions);
        console.log('Verification email sent');
    } catch (error) {
        console.error('Error sending email:', error);
        }
    }

router.get('/verification/link/:email/:token', upload.none(), async (req, res) => {
    const { email, token } = req.params;
    sendVerificationEmail(email, token);
    return res.status(200).json({msg: "working rn."});
    });


module.exports = router;
