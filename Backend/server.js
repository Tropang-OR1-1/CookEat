const path = require('path');
const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');
const postHandler = require('./config/socket/post'); // Import user connection events
const {notificationHandler, sendNotificationToUsers,
      connectedUsers, getBitByName} = require('./config/socket/notification');
const { socketAuth } = require('./config/jwt');
const logger = require('./config/logger');
const db = require("./config/db");
require("dotenv").config(); // Load environment variables from .env

const app = express();

// Middleware to enable cross-origin requests (CORS)
app.use(cors());

// Include route files
const profileRoutes = require('./routes/user/profile');
const logonRoutes = require('./routes/user/logon');
const followRoutes = require('./routes/user/follows');
const savesRoutes = require('./routes/user/saves');
const settingsRoutes = require('./routes/user/settings');

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
app.use('/user/settings', settingsRoutes);

app.use('/media', mediaRoutes);
app.use('/posts', postsRoutes);
app.use('/comments', commentRoutes);
app.use('/react', reactRoutes);

app.use('/recipe', recipeRoutes);
app.use('/recipe', rateRoutes);

app.use('/query', feedRoutes);
app.use('/query', searchRoutes);


app.get('/testing/notif/trigger/:event', async (req, res) => {
  const client = await db.connect();
  const tname = getBitByName(req.params.event);
  if (tname === null) return res.status(401).json({error: "Invalid Event."});
  let userIds = req.query.user_id ?? [];
  let data = req.query.data ?? {};

  if (typeof userIds === 'string') {
    try {
      // Parse the string representation of the array
      userIds = JSON.parse(userIds);
      }
    catch (err) {
      logger.error(`Error parsing userIds: ${err}`);
      return;
      }
    }
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data); // Convert string to key-value object
      }
    catch (err) {
      logger.error(`Error parsing 'data' query parameter: ${err}`);
      return res.status(400).json({ error: "Invalid data format. Must be a JSON object." });
      }
    }

  sendNotificationToUsers(userIds, tname, data, client);
  return res.status(200).json({msg: "Hello", query: req.query});
  })


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

const io = new Server(server, {
      cors: {
        origin: 'http://127.0.0.1:5500',
        methods: ['GET', 'POST']
      }
    });

io.use(socketAuth);

// Connection event for new clients
io.on('connection', (socket) => {
  //console.log(`Socket ID: ${socket.id}\nUserID: ${socket.user.id}`);
  logger.info(`[+] Connected as ${socket.id}`);
  
  if (socket.user && socket.user.id)
    connectedUsers[socket.user.id] = socket.id;

  postHandler(io, socket); // Post view related events
  notificationHandler(io, socket); // Notification related events

  // Handle client disconnection
  socket.on('disconnect', () => {
    if (socket.user && socket.user.id) {
      logger.info(`User ${socket.user.id} with socket ID ${socket.id} disconnected`);
      delete connectedUsers[socket.user.id];  // Remove the socket ID from connectedUsers
      }
    console.log('A client disconnected');
    });
  });

module.exports.io = io;
