const connectedUsers = {}; // userId => socket.id

module.exports = (io, socket) => {
    // When user connects and identifies themselves
    socket.on('registerUser', (userId) => {
        connectedUsers[userId] = socket.id;
        console.log(`User ${userId} connected with socket ID ${socket.id}`);
    });

    // Manually send notification to specific user
    socket.on('sendNotification', ({ toUserId, message }) => {
        const recipientSocketId = connectedUsers[toUserId];
        if (recipientSocketId) {
            io.to(recipientSocketId).emit('notification', { message });
            console.log(`Sent notification to user ${toUserId}`);
        } else {
            console.log(`User ${toUserId} not connected`);
        }
    });

    // Clean up on disconnect
    socket.on('disconnect', () => {
        for (const userId in connectedUsers) {
            if (connectedUsers[userId] === socket.id) {
                delete connectedUsers[userId];
                console.log(`User ${userId} disconnected`);
                break;
            }
        }
    });
};
