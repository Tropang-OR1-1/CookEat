// redisRateLimiter.js
const redis = require('redis'); // Import the Redis client

// Create a Redis client and connect
const redisClient = redis.createClient({
    host: process.env.REDIS_HOST || 'localhost', // Replace with your Redis host if necessary
    port: process.env.REDIS_PORT || 6379, // Default Redis port
    // Optionally add authentication, password, etc.
});

// Function to check and increase failed attempts in Redis
async function checkFailedAttempts(clientIp, uuid) {
    const key = `failed_attempts:mediaUuid:${uuid}:${clientIp}`;

    return new Promise((resolve, reject) => {
        redisClient.get(key, (err, attempts) => {
            if (err) {
                reject(`Error checking Redis: ${err}`);
            }

            attempts = parseInt(attempts) || 0;

            if (attempts >= 5) {
                // Block access if too many failed attempts
                resolve(true);
            } else {
                // Increment failed attempts in Redis
                redisClient.multi()
                    .incr(key) // Increment the failed attempts count
                    .expire(key, 3600) // Set the key to expire in 1 hour (to reset failed attempts after 1 hour)
                    .exec((err, results) => {
                        if (err) {
                            reject(`Error incrementing failed attempts in Redis: ${err}`);
                        }
                        resolve(false); // Allow the request to continue
                    });
            }
        });
    });
}

module.exports = { checkFailedAttempts };
