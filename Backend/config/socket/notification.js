const { isvalidUUID } = require('../defines');
const db = require('../db'); // PostgreSQL client
const logger = require('../logger'); // Logger for error handling
const connectedUsers = {}; // userId => socket.id

const NOTIF_TYPES = [
    {
        bit: '00000001',
        name: 'FOLLOW',
        build: ({ username }) => `${username} followed you.`,
    },
    {
        bit: '00000010',
        name: 'MUTUAL_FOLLOW',
        build: ({ username }) => `You and ${username} followed each other.`,
    },
    {
        bit: '00000100',
        name: 'USER_POST',
        build: ({ username }) => `${username} posted something new.`,
    },
    {
        bit: '00001000',
        name: 'POST_UPDATE',
        build: ({ details }) => `Post update: ${details}`,
    },
    {
        bit: '00010000',
        name: 'COMMENT',
        build: ({ username, comment }) => `${username} commented: "${comment}"`,
    },
    {
        bit: '00100000',
        name: 'REACTION',
        build: ({ username, reaction }) => `${username} reacted with ${reaction} on your post.`,
    },
    {
        bit: '01000000',
        name: 'RECIPE_POST',
        build: ({ recipe_name }) => `New recipe posted: ${recipe_name}`,
    },
    {
        bit: '10000000',
        name: 'ADMIN_ANNOUNCEMENT',
        build: ({ title, message }) => `Admin: ${title} - ${message}`,
    },
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
        id: notif.id,
        user_id: notif.user_id,
        message: type?.build ? type.build(data) : 'You have a new notification',
        data,
        notif_type: type?.name || 'UNKNOWN',
        timestamp: notif.timestamp,
        is_read: notif.is_read,
    };
};

// Fetch unread notifications for a user based on their bitmask
const fetchRawNotifications = async (userId, notifBitmask) => {
    const query = `
        SELECT n.id, $1 AS user_id, n.notif_type, n.data, n.timestamp,
               COALESCE(s.is_read, false) AS is_read
        FROM user_notification n
        LEFT JOIN user_notification_status s
            ON s.notif_id = n.id AND s.user_id = $1
        WHERE (n.notif_type::bit(8) & $2::bit(8)) <> B'00000000'
          AND COALESCE(s.is_read, false) = false;
    `;
    const values = [userId, notifBitmask.toString(2).padStart(8, '0')];
    const res = await db.query(query, values);
    return res.rows;
};

const markAllNotificationsAsRead = async (userId) => {
    const query = `
        UPDATE user_notification_status
        SET is_read = true
        WHERE user_id = $1 AND is_read = false;
    `;
    await db.query(query, [userId]);
};

// Socket.IO setup
module.exports = (io, socket) => {
    socket.on('registerUser', async (publicId) => {
        if (!isvalidUUID(publicId)) return;

        try {
            const res = await db.query(
                `SELECT id, notif_bit FROM user_profile WHERE public_id = $1`,
                [publicId]
            );
            if (res.rows.length === 0) return;

            const userinfo = res.rows[0];
            socket.userId = userinfo.id;
            socket.notifBitmask = userinfo.notif_bit;
            connectedUsers[userinfo.id] = socket.id;

            logger.info(`User ${userinfo.id} connected via socket ${socket.id}`);

            const notifs = await fetchRawNotifications(userinfo.id, userinfo.notif_bit);
            const messages = notifs.map(buildNotificationMessage);
            socket.emit('notificationBatch', messages);
        } catch (err) {
            logger.error('Error during user registration:', err);
        }
    });

    socket.on('markNotificationAsRead', async (notifId) => {
        if (!socket.userId || !notifId) return;

        try {
            const query = `
                INSERT INTO user_notification_status (notif_id, user_id, is_read)
                VALUES ($1, $2, true)
                ON CONFLICT (notif_id, user_id) DO UPDATE SET is_read = true;
            `;
            await db.query(query, [notifId, socket.userId]);
        } catch (err) {
            logger.error(`Error marking notification as read:, ${err.stack}`);
        }
    });

    socket.on('markAllAsRead', async () => {
        if (!socket.userId) return;
        try {
            await markAllNotificationsAsRead(socket.userId);
        } catch (err) {
            logger.error(`Error marking all as read: ${err}`);
        }
    });

    socket.on('disconnect', () => {
        if (socket.userId) {
            delete connectedUsers[socket.userId];
        }
    });
};

// Insert a new notification and optionally emit it
const insertNotification = async (userId, notifType, data, client) => {
    const query = `
        INSERT INTO user_notification (user_id, notif_type, data, timestamp, is_read)
        VALUES ($1, $2, $3, NOW(), false)
        RETURNING id;
    `;
    const values = [userId, notifType, JSON.stringify(data)];
    try {
        const res = await client.query(query, values);
        return res.rows[0].id;
    } catch (err) {
        logger.error(`Error inserting notification: ${err}`);
        return null;
    }
};

module.exports.sendNotificationToUser = async (userId, notifType, data, io, client) => {
    const notifId = await insertNotification(userId, notifType, data, client);
    if (!notifId) {
        logger.error(`Failed to insert notification into the database.`);
        return;
    }

    try {
        const res = await client.query(`
            SELECT n.id, $1 AS user_id, n.notif_type, n.data, n.timestamp,
                   COALESCE(s.is_read, false) AS is_read
            FROM user_notification n
            LEFT JOIN user_notification_status s
                ON s.notif_id = n.id AND s.user_id = $1
            WHERE n.id = $2
        `, [userId, notifId]);

        const notif = res.rows[0];
        const built = buildNotificationMessage(notif);

        const socketId = connectedUsers[userId];
        if (socketId) {
            io.to(socketId).emit('notification', built);
        }
    } catch (err) {
        logger.error(`Error fetching/sending notification: ${err}`);
    }
};

module.exports.NOTIF_TYPES = NOTIF_TYPES;
module.exports.getBitByName = getBitByName;
