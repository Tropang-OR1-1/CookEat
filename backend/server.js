const express = require('express');
const app = express();

// Import the profile routes
const profileRoutes = require('./routes/profile');
const loginRoutes = require('./routes/logon');

// Use the profile routes
app.use('/', profileRoutes);  // Mount at '/api/profile'
app.use('/', loginRoutes);  // Mount at '/api/login'

// Define the port (you can change this or load from `.env`)
const port = process.env.PORT || 3000;

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
