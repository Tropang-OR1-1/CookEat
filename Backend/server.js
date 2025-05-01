

/*
require('@babel/register')({
    extensions: ['.js', '.jsx'],
    ignore: [/node_modules/]  // Prevent Babel from transpiling node_modules
  });
  */
 
const React = require('react');
const ReactDOMServer = require('react-dom/server');
  
const path = require('path');

const express = require('express');
const cors = require('cors');
require("dotenv").config(); // Load environment variables from .env
const logger = require('./config/logger'); // Import the logger

//const App = require('./../Frontend/ssr/App.jsx').default;

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

const feedRoutes = require('./routes/query/feed');
const searchRoutes = require('./routes/query/search');
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

app.use('/query', feedRoutes);
app.use('/query', searchRoutes);
/*
app.get('/', (req, res) => {
    const html = ReactDOMServer.renderToString(React.createElement(App));
  
    res.send(`
      <!DOCTYPE html>
      <html>
        <head><title>CookEat</title></head>
        <body>
          <div id="root">${html}</div>
        </body>
      </html>
    `);
  });
*/
// Start the server
app.listen(process.env.API_PORT, () => {
  console.log(`Server running on port ${process.env.API_PORT}`);
});

// Catch-all for unknown routes
app.use((req, res) => {
    const requestedUrl = req.originalUrl;
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const method = req.method; // Capture the HTTP method (GET, POST, etc.)

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