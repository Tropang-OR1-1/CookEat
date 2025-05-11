const path = require('path');
const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');
const postHandler = require('./config/socket/post'); // Import user connection events


require("dotenv").config(); // Load environment variables from .env

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

// Handle all other routes for the React app by serving the index.html
// Correct usage with named wildcard parameter
// Serve index.html for all non-API routes
app.get('*path', (req, res) => {
  res.sendFile(path.join(__dirname, '../Frontend/dist', 'index.html'));
});

// Start the server
const server = app.listen(process.env.API_PORT, () => {
  console.log(`Server running on port ${process.env.API_PORT}`);
});


// Initialize Socket.IO
/*
const io = new Server(server, {
  cors: {
    origin: 'http://127.0.0.1:5500',
    methods: ['GET', 'POST']
  }
});


// Connection event for new clients
io.on('connection', (socket) => {
  console.log('Client ID: ', socket.id);

  postHandler(io, socket); // Post view related events
  //notificationHandler(io, socket); // Notification related events

  // Handle client disconnection
  socket.on('disconnect', () => {
    console.log('A client disconnected');
    });
  });*/