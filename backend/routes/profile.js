const express = require("express");
const router = express.Router();  // Create the router instance

// Define your route here
router.get("/hello", (req, res) => {
    res.json({ message: "Hello from the server!" });
});

module.exports = router;  // Export the router to be used in server.js
