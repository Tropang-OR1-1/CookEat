

const express = require('express');
const cors = require('cors');
require("dotenv").config(); // Load environment variables from .env

const app = express();

// Middleware to enable cross-origin requests (CORS)
app.use(cors());




// Include route file
const profileRoutes = require('./routes/profile');
const logonRoutes = require('./routes/logon');
const mediaRoutes = require('./routes/media');

// Mount the routes
app.use('/profile', profileRoutes);
app.use('/', logonRoutes);
app.use('/media', mediaRoutes);
// Start the server
app.listen(process.env.API_PORT, () => {
  console.log(`Server running on port ${process.env.API_PORT}`);
});



/*
const express = require('express');
const multer = require('multer');
const app = express();

// Use multer for parsing multipart/form-data
const upload = multer(); // Will not save files, only parse form-data

app.use(express.json()); // For handling application/json
app.use(express.urlencoded({ extended: true })); // For handling x-www-form-urlencoded

// Register route
app.post('/register', upload.none(), (req, res) => {
    console.log(req.body); // Log the body to see if it's being received

    const { username, password, email } = req.body; 

    if (!username || !password || !email) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    // Logic for registration
    res.json({
        message: "Registration successful",
        data: { username, email }
    });
});

app.listen(3000, () => {
    console.log(`Server running on port ${3000}`);
  });

  */