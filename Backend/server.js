const path = require('path');
const express = require('express');
const cors = require('cors');
require("dotenv").config(); // Load environment variables from .env
const logger = require('./config/logger'); // Import the logger

const app = express();

// Middleware to enable cross-origin requests (CORS)
app.use(cors());

// Include route files
const profileRoutes = require('./routes/user/profile');
const logonRoutes = require('./routes/user/logon');
const followRoutes = require('./routes/user/follows');
const savesRoutes = require('./routes/user/saves');
const recipeRoutes = require('./routes/recipe/recipe');
const rateRoutes = require('./routes/recipe/rating');
const mediaRoutes = require('./routes/media');
const postsRoutes = require('./routes/feed/posts');
const commentRoutes = require('./routes/feed/comments');
const reactRoutes = require('./routes/feed/reactions');
const feedRoutes = require('./routes/query/feed');
const searchRoutes = require('./routes/query/search');

// Mount the API routes
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

app.use('/query', feedRoutes);
app.use('/query', searchRoutes);

// Serve static assets for the React app
app.use(express.static(path.join(__dirname, '../Frontend/dist')));

// Redirect the root URL to '/app'
app.get('/', (req, res) => {
  res.status(301).redirect('/app'); // Redirect to the React app
});

// Handle all other routes for the React app by serving the index.html
app.get('/app/', (req, res) => {
  res.sendFile(path.join(__dirname, '../Frontend/dist', 'index.html'));
});

// Catch-all for unknown API routes
app.use((req, res) => {
  const requestedUrl = req.originalUrl;
  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const method = req.method;

  // Log the details including the method
  logger.warn(`404 Not Found: IP ${clientIp} tried to access ${requestedUrl} with method ${method}`);

  res.status(404).sendFile(path.join(process.env.ERROR_404_PATH), (err) => {
    if (err) {
      logger.error(`Error sending 404 page: ${err}`);
      if (!res.headersSent) {
        res.status(500).send('Internal Server Error');
      }
    }
  });
});

// Start the server
app.listen(process.env.API_PORT, () => {
  console.log(`Server running on port ${process.env.API_PORT}`);
});
