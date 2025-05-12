const db = require('../db');
const logger = require('../logger');
let IO; // Global io
const connectedUsers = {};

const NOTIF_TYPES = [
    { bit: '00000001', name: 'follow', build: ({ username }) => `${username} followed you.` },
    { bit: '00000010', name: 'mutual_follow', build: ({ username }) => `You and ${username} just followed each other.` },
    { bit: '00000100', name: 'post_create', build: ({ username }) => `${username} posted something new.` },
    { bit: '00001000', name: 'post_update', build: ({ username }) => `New update from ${username}, don't miss it!` },
    { bit: '00010000', name: 'comment', build: ({ username, comment }) => `${username} commented on your post: "${comment}"` },
    { bit: '00100000', name: 'reaction', build: ({ username, reaction, type }) => `${username} reacted with ${reaction} on your ${type}.` },
    { bit: '01000000', name: 'recipe_suggest', build: ({ recipe_name }) => `Best recipe to your liking: ${recipe_name}` },
    { bit: '10000000', name: 'admin_broadcast', build: ({ name='Admin', title, message }) => `${name}: ${title} - ${message}` },
];

const getBitByName = (name) => {
    const found = NOTIF_TYPES.find(n => n.name === name);
    return found ? found.bit : null;
};

const buildNotificationMessage = (notif) => {
    let data;
    try {
        data = JSON.parse(notif.data);
    } catch {
        data = {};
    }
    const bit = notif.notif_type.padStart(8, '0');
    const type = NOTIF_TYPES.find(n => n.bit === bit);
    return {
        notif_id: notif.id,
        msg: type?.build ? type.build(data) : 'You have a new notification',
        ref: data.ref || notif.data.ref,
        timestamp: notif.timestamp,
        is_read:notif.is_read
    };
};


// Emit notification to a connected user
const emitNotification = (io, userId, event, data) => {
    const socketId = connectedUsers[userId];
    if (socketId) {
        io.to(socketId).emit(event, data);
    }
};

const fetchUnreadNotifications = async (userId, client) => {
    const query = `
        SELECT n.id, n.notif_type, n.data, n.timestamp,
               COALESCE(s.is_read, false) AS is_read
        FROM user_notification n
        LEFT JOIN user_notification_status s
            ON s.notif_id = n.id
        JOIN user_profile us
            ON us.id = s.user_id
        WHERE s.user_id = $1 
          AND COALESCE(s.is_read, false) = false
          AND (CAST(n.notif_type AS bit(8)) & us.notif_bit::bit(8))::int > 0;
    `;
    const res = await client.query(query, [userId]);
    return res.rows.map(buildNotificationMessage);
};



// Insert a new notification and emit to multiple users
const sendNotificationToUsers = async (userIds, notifType, data, client) => {
    try {
        const notifQuery = `
            INSERT INTO user_notification (notif_type, data, timestamp)
            VALUES ($1, $2, NOW())
            RETURNING id, notif_type, timestamp, data;
        `;
        const notifRes = await client.query(notifQuery, [notifType, JSON.stringify(data)]);
        const notif = notifRes.rows[0];

        const statusQuery = `
            INSERT INTO user_notification_status (notif_id, user_id, is_read)
            VALUES ($1, unnest($2::int[]), false);
        `;
        
        await client.query(statusQuery, [notif.id, userIds]);

        // Build the notification message using the provided function
        const message = buildNotificationMessage({
            id: notif.id,
            notif_type: notifType,
            data: JSON.stringify(data),  // Ensure data is in string format
            timestamp: notif.timestamp,
            is_read: false
            });

        // Send the built message to each user
        userIds.forEach(userId => {
            emitNotification(IO, userId, 'notification', message);
            });

        logger.info(`Notification sent to users: ${userIds.join(', ')}`);
    } catch (err) {
        logger.error(`Error inserting notification: ${err}`);
    }
};


const markNotificationsAsRead = async (userId, notificationIds) => {
    if (notificationIds.length === 0) {
        const query = `
            UPDATE user_notification_status
            SET is_read = true
            WHERE user_id = $1 AND is_read = false;
        `;
        await db.query(query, [userId]);
        } 
    else {
        const query = `
            UPDATE user_notification_status
            SET is_read = true
            WHERE user_id = $1 AND notif_id = ANY($2) AND is_read = false;
        `;
        await db.query(query, [userId, notificationIds]);
        }
    };

const notificationHandler = (io, socket) => {
    if (!IO) IO = io;  // Store io only once
    socket.on('notify', async () => {
        if (socket.user.id) {
            const unreadNotifs = await fetchUnreadNotifications(socket.user.id, db);
            if (unreadNotifs.length > 0) {
                emitNotification(io, socket.user.id, 'notificationBatch', unreadNotifs);
                }
            }
        });
    
    socket.on('markAsRead', async ({ notificationIds }) => {
        if (!socket.user.id) return;
        try {
            if (notificationIds && Array.isArray(notificationIds)) {
                // Mark the notifications as read based on the provided array
                await markNotificationsAsRead(socket.user.id, notificationIds);
            } else {
                // If notificationIds is not passed, mark all notifications as read
                await markNotificationsAsRead(socket.user.id, []);
                }

            socket.emit('markedAsRead', { success: true });
        } catch (err) {
            logger.error(`Error marking as read: ${err}`);
            socket.emit('markedAsRead', { success: false, error: err.message });
            }
        });

    };


module.exports.notificationHandler= notificationHandler;
module.exports.NOTIF_TYPES = NOTIF_TYPES;
module.exports.sendNotificationToUsers = sendNotificationToUsers;
module.exports.getBitByName = getBitByName;
module.exports.connectedUsers = connectedUsers;

