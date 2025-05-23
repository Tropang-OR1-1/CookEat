import React from 'react';

function NotificationItem({ id, sender, message, time, unread, avatarUrl, onClick }) {
    return (
        <li className="notification-item" onClick={onClick}>
            <img src={avatarUrl || '/default-avatar.png'} className="avatar" alt="avatar" />
            <div className="text-content">
                <p><strong>{sender}</strong> {message}</p>
                <span className="time">{time}</span>
            </div>
            {unread && <span className="dot"></span>}
        </li>
    );
}

export default NotificationItem;
