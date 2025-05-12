import React, { useState, useEffect } from 'react';
import './styles/notification.css';

const sampleNotifications = [
    { id: 1, sender: 'Bernie', message: 'liked your post.', unread: true, avatar: 'avatar1.jpg', time: '2m' },
    { id: 2, sender: 'Michael', message: 'commented: "Sarap pre!”', unread: false, avatar: 'avatar2.jpg', time: '10m' },
    { id: 3, sender: 'Jay', message: 'shared your recipe.', unread: true, avatar: 'avatar3.jpg', time: '1h' },
];

function Notification({ isOpen, onClose }) {
    const [activeTab, setActiveTab] = useState('All');
    const [notifications, setNotifications] = useState(sampleNotifications);

    const filteredNotifications =
        activeTab === 'Unread'
            ? notifications.filter(n => n.unread)
            : notifications;

    useEffect(() => {
        console.log("Notifications component mounted");
    }, []);

    const handleNotificationClick = (id) => {
        console.log(`Notification ${id} clicked`);
        setNotifications(prev =>
            prev.map(n => n.id === id ? { ...n, unread: false } : n)
        );
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay show" onClick={(e) => e.target.classList.contains('modal-overlay') && onClose()}>
            <div className="notification-panel show">
                <div className="notification-header">
                    <strong>Notifications</strong>
                    <span className="tabs">
                        <button
                            className={`tab ${activeTab === 'All' ? 'active' : ''}`}
                            onClick={() => setActiveTab('All')}
                        >
                            All
                        </button>
                        <button
                            className={`tab ${activeTab === 'Unread' ? 'active' : ''}`}
                            onClick={() => setActiveTab('Unread')}
                        >
                            Unread
                        </button>
                    </span>
                    <span className="close-btn" onClick={onClose}>✖</span>
                </div>

                <div className="notification-section">
                    <div className="notification-subheader">
                        <span>New</span>
                        <a href="/notifications">See all</a>
                    </div>

                    <ul className="notification-list">
                        {filteredNotifications.length === 0 ? (
                            <div className="empty-state">
                                <p>No notifications at the moment.</p>
                            </div>
                        ) : (
                            filteredNotifications.map(notif => (
                                <li
                                    className="notification-item"
                                    key={notif.id}
                                    onClick={() => handleNotificationClick(notif.id)}
                                >
                                    <img src={notif.avatar} className="avatar" alt="avatar" />
                                    <div className="text-content">
                                        <p><strong>{notif.sender}</strong> {notif.message}</p>
                                        <span className="time">{notif.time}</span>
                                    </div>
                                    {notif.unread && <span className="dot"></span>}
                                </li>
                            ))
                        )}
                    </ul>
                </div>

                <div className="see-previous">
                    <button onClick={() => console.log('See previous clicked')}>See previous notifications</button>
                </div>
            </div>
        </div>
    );
}

export default Notification;
