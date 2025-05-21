

require("dotenv").config({path: "../.env.sensitive" }); // Load environment variables from .env

console.log("Hello World");
console.log(process.env.JWT_SECRET);
