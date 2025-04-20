

const express = require('express');
const cors = require('cors');
require("dotenv").config(); // Load environment variables from .env
const multer = require('multer');

const app = express();

// Middleware to enable cross-origin requests (CORS)
app.use(cors());

// Include route file
const profileRoutes = require('./routes/user/profile');
const logonRoutes = require('./routes/user/logon');
const followRoutes = require('./routes/user/follows');
const savesRoutes = require('./routes/user/saves');


const recipeRoutes = require('./routes/recipe/recipe');
const rateRoutes = require('./routes/recipe/rating');

const mediaRoutes = require('./routes/media');
const postsRoutes = require('./routes/feed/posts')
const commentRoutes = require('./routes/feed/comments');
const reactRoutes = require('./routes/feed/reactions');
// Mount the routes

app.use('/user', profileRoutes);
app.use('/user', logonRoutes);
app.use('/user', followRoutes);
app.use('/user', savesRoutes);

app.use('/media', mediaRoutes);
app.use('/posts', postsRoutes);
app.use('/comments', commentRoutes);
app.use('/react', reactRoutes);

app.use('/recipe', recipeRoutes);
app.use('/recipe', rateRoutes);


// Start the server
app.listen(process.env.API_PORT, () => {
  console.log(`Server running on port ${process.env.API_PORT}`);
});

// Catch-all for unknown routes
app.use((req, res, next) => {
    res.status(404).json({ error: 'Routes not found' });
});

/*
// Global error handler
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        return res.status(400).json({ error: err.message });
    } else if (err) {
        return res.status(500).json({ error: 'Something went wrong with the file upload.' });
    }
    next();
});

*/