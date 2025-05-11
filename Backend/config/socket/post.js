const db = require('../db'); // PostgreSQL DB connection

const postViewCache = {}; // { postId: [{ socketId, timestamp }] }
const socketCurrentPost = {}; // { socketId: postId }
const activeTimers = {}; // { socketId: Timeout }
const typingState = {}; // { postId: { commentID, typing: true/false} }

const UPDATE_INTERVAL = 10000; // 10 seconds
const VIEW_TIMEOUT = 5000; // 5 seconds
const VIEW_EXPIRY_MS = 15000; // Viewer entries older than 15s are cleaned

module.exports = (io, socket) => {
    socket.on('viewPost', (postId) => {
        const previousPostId = socketCurrentPost[socket.id];

        // Handle switching from another post
        if (previousPostId && postViewCache[previousPostId]) {
            postViewCache[previousPostId] = postViewCache[previousPostId].filter(
                view => view.socketId !== socket.id
            );
            io.emit('postViewCountUpdate', {
                postId: previousPostId,
                count: postViewCache[previousPostId].length,
            });
        }

        socketCurrentPost[socket.id] = postId;

        // Init array if no viewers for this post
        if (!postViewCache[postId]) {
            postViewCache[postId] = [];
        }

        // Add this socket to the viewers list
        postViewCache[postId].push({
            socketId: socket.id,
            timestamp: Date.now(),
        });

        // Send typing info to new viewers if typing is in progress for the post
        if (typingState[postId] && typingState[postId].typing) {
            socket.emit('typingComment', {
                postID: postId,
                commentID: typingState[postId].commentID,
            });
        }

        // Update view count on the client side
        io.emit('postViewCountUpdate', {
            postId,
            count: postViewCache[postId].length,
        });

        // Clear previous timer if it exists
        if (activeTimers[socket.id]) {
            clearTimeout(activeTimers[socket.id]);
        }

        // Track view for DB (after VIEW_TIMEOUT)
        activeTimers[socket.id] = setTimeout(() => {
            console.log(`Socket ${socket.id} counted as view for post ${postId}`);
        }, VIEW_TIMEOUT);
    });

    socket.on('disconnect', () => {
        const postId = socketCurrentPost[socket.id];
        if (!postId) return;

        clearTimeout(activeTimers[socket.id]);

        // Remove the socket from the viewers list
        if (postViewCache[postId]) {
            postViewCache[postId] = postViewCache[postId].filter(
                view => view.socketId !== socket.id
            );
        }

        delete socketCurrentPost[socket.id];
        delete activeTimers[socket.id];

        console.log(`Socket ${socket.id} disconnected`);
    });

    // --- Real-time typing comment support ---
    socket.on('typingComment', ({ postID, commentID }) => {
        const viewers = postViewCache[postID];
        if (!viewers || viewers.length === 0) {
            return;
        }

        // Set the typing state for the post
        typingState[postID] = { commentID, typing: true };

        // Send typing notification to all current viewers of this post
        viewers.forEach(({ socketId }) => {
            if (socketId !== socket.id) {  // Prevent sending to the sender
                socket.to(socketId).emit('typingComment', { postID, commentID });
            }
        });
    });

    // --- Stop typing notification ---
    socket.on('stopTypingComment', ({ postID }) => {
        if (typingState[postID]) {
            typingState[postID].typing = false;
            // Stop emitting typing notifications for this post
            const viewers = postViewCache[postID];
            viewers.forEach(({ socketId }) => {
                socket.to(socketId).emit('stopTypingComment', { postID });
            });
        }
    });
};

// Clean expired viewers and update DB
function updateDatabaseAtInterval() {
    const query = `
        UPDATE posts
        SET view_count = view_count + $2
        WHERE id = $1
    `;

    console.log('Running DB update...');

    const now = Date.now();

    Object.keys(postViewCache).forEach(postId => {
        // Remove expired viewers
        const original = postViewCache[postId];
        const validViews = original.filter(view => now - view.timestamp <= VIEW_EXPIRY_MS);
        const expiredCount = original.length - validViews.length;

        postViewCache[postId] = validViews;

        // Update DB if there are expired views
        if (expiredCount > 0) {
            const values = [postId, expiredCount];

            db.query(query, values)
                .then(() => {
                    console.log(`Updated post ${postId} with +${expiredCount} views`);
                })
                .catch(err => {
                    console.error(`Error updating post ${postId}:`, err);
                });
        }
    });
}

// Run the DB update every 10 seconds
//setInterval(updateDatabaseAtInterval, UPDATE_INTERVAL);
