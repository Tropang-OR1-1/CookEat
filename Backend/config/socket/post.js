const db = require('../db');
const { isValidUUID } = require('../defines');

const postViewCache = {};

const socketCurrentPost = {};
const activeTimers = {};
const typingState = {};
const viewedSockets = {};

const UPDATE_INTERVAL = 10000;
const VIEW_TIMEOUT = 5000;
const VIEW_EXPIRY_MS = 15000;
const viewIncrements = {};

const postHandler = (io, socket) => {
    socket.on('viewPost', (postId) => {
        if (!isValidUUID(postId)){ 
            socket.emit('client_error', { message: 'postID Invalid format. must be in UUIDs' });
            return;
            }

        const previousPostId = socketCurrentPost[socket.id];
        if (previousPostId === postId) return; // same post watching

        if (previousPostId && previousPostId !== postId) {
            if (typingState[previousPostId]) {
                Object.keys(typingState[previousPostId]).forEach((commentID) => {
                    if (typingState[previousPostId][commentID]) {
                        socket.to(`post_${previousPostId}`).emit('stopTypingComment', { postID: previousPostId, commentID });
                        typingState[previousPostId][commentID] = false;
                    }
                });
            }
            socket.leave(`post_${previousPostId}`);
            postViewCache[previousPostId] = postViewCache[previousPostId].filter(
                view => view.socketId !== socket.id
            );

            io.to(`post_${previousPostId}`).emit('postViewCountUpdate', {
                postId: previousPostId,
                count: postViewCache[previousPostId].length,
            });
        }

        socket.join(`post_${postId}`);
        socketCurrentPost[socket.id] = postId;

        if (!postViewCache[postId]) {
            postViewCache[postId] = [];
        }

        postViewCache[postId].push({
            socketId: socket.id,
            timestamp: Date.now(),
        });

        io.to(`post_${postId}`).emit('postViewCountUpdate', {
            postId,
            count: postViewCache[postId].length,
        });

        if (activeTimers[socket.id]) {
            clearTimeout(activeTimers[socket.id]);
        }

        activeTimers[socket.id] = setTimeout(() => {
            if (!viewedSockets[postId]) viewedSockets[postId] = new Set();

            if (!viewedSockets[postId].has(socket.id)) {
                viewIncrements[postId] = (viewIncrements[postId] || 0) + 1;
                viewedSockets[postId].add(socket.id);
            }
        }, VIEW_TIMEOUT);
    });

    socket.on('stopViewingPost', () => {
        stopViewingPost(io, socket);
    });

    socket.on('typingComment', ({ commentID, toggle }) => {
        handleTypingComment(socket, commentID, toggle, socketCurrentPost, typingState);
    });

    
    };


// stopTypingComment.js

// stopTypingComment.js

const stopViewingPost = (io, socket) => {
    const viewedPost = socketCurrentPost[socket.id];
    if (viewedPost && postViewCache[viewedPost]) {
        // Remove the socket from the post view cache
        postViewCache[viewedPost] = postViewCache[viewedPost].filter(view => view.socketId !== socket.id);
        socket.leave(`post_${viewedPost}`);
        
        // Emit the updated post view count
        io.to(`post_${viewedPost}`).emit('postViewCountUpdate', {
            postId: viewedPost,
            count: postViewCache[viewedPost].length,
        });
    }
    socketCurrentPost[socket.id] = null;
    };

const stopTypingComment = (socket, socketCurrentPost, typingState) => {
    // Get current post ID from socket
    const postId = socketCurrentPost[socket.id];
    if (!postId) return;

    // Initialize typing state if not existing
    if (!typingState[postId]) typingState[postId] = {};

    // Find previous typing comment ID
    const prevCommentID = Object.keys(typingState[postId]).find((id) => typingState[postId][id]);
    if (prevCommentID) {
        typingState[postId][prevCommentID] = false;
        socket.to(`post_${postId}`).emit('stopTypingComment', { postID: postId, commentID: prevCommentID });
    }
};

const handleTypingComment = (socket, commentID, toggle, socketCurrentPost, typingState) => {
    // Validate commentID
    if (!isValidUUID(commentID) && commentID !== 'root') {
        socket.emit('client_error', { message: 'commentID Invalid format. must be in UUIDs' });
        return;
    }

    // Get current post ID from socket
    const postId = socketCurrentPost[socket.id];
    if (!postId) return;

    // Initialize typing state if not existing
    if (!typingState[postId]) typingState[postId] = {};

    // Handle switching between comments/posts
    const prevCommentID = Object.keys(typingState[postId]).find((id) => id !== commentID && typingState[postId][id]);
    if (prevCommentID) {
        stopTypingComment(socket, socketCurrentPost, typingState);
    }

    // Update typing state and emit event
    if (toggle !== typingState[postId][commentID]) {
        typingState[postId][commentID] = toggle;
        const event = toggle ? 'typingComment' : 'stopTypingComment';
        socket.to(`post_${postId}`).emit(event, { postID: postId, commentID });
    }
};

const handleTypingDisconnect = (socket) => {
    const postId = socketCurrentPost[socket.id];
    if (postId) {
        stopTypingComment(socket, socketCurrentPost, typingState);
    }
    console.log('A client disconnected');
};

function updateDatabaseAtInterval() {
    const query = `
        UPDATE posts
        SET view_count = view_count + $2
        WHERE public_id = $1
    `;

    Object.keys(viewIncrements).forEach(postId => {
        const increment = viewIncrements[postId];
        if (increment > 0) {
            const values = [postId, increment];

            db.query(query, values)
                .then(() => {
                    viewIncrements[postId] = 0;
                    viewedSockets[postId] = new Set();
                })
                .catch(err => {
                    console.error(`Error updating post ${postId}:`, err);
                });
        }
    });
}

setInterval(updateDatabaseAtInterval, UPDATE_INTERVAL);

module.exports = { stopViewingPost, postHandler, handleTypingDisconnect };
