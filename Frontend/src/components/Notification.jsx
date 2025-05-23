import React, { useState, useEffect } from 'react';
import axios from 'axios';
import NotificationItem from './Notification/NotificationItem';
import './styles/notification.css';

const sampleNotifications = [
    { id: 1, sender: 'CuzRy', message: 'liked your post.', unread: true, avatar: '02a638a5-a5b1-4df5-b9ee-a36ae7d96067.png', time: '2m' },
    { id: 2, sender: 'Ham', message: 'commented: "Sarap pre!”', unread: false, avatar: 'ce39cbfd-9d1d-422c-bf32-ace294bd14af.jpg', time: '10m' },
    { id: 3, sender: 'Jay', message: 'shared your recipe.', unread: true, avatar: '26ff3952-fcbc-4216-b7cc-5586c8c3140e.png', time: '1h' },
];

function Notification({ isOpen, onClose }) {
    const [activeTab, setActiveTab] = useState('All');
    const [notifications, setNotifications] = useState(sampleNotifications);
    const [avatars, setAvatars] = useState({});

    useEffect(() => {
        console.log("Notifications component mounted");

        const fetchAvatars = async () => {
            const newAvatars = {};
            for (const notif of sampleNotifications) {
                try {
                    const response = await axios.get(
                        `https://cookeat.cookeat.space/media/profile/${notif.avatar}`,
                        { responseType: 'blob' }
                    );
                    newAvatars[notif.id] = URL.createObjectURL(response.data);
                } catch (err) {
                    console.error(`Failed to load avatar for ${notif.sender}:`, err);
                    newAvatars[notif.id] = ''; // Fallback or empty avatar
                }
            }
            setAvatars(newAvatars);
        };

        fetchAvatars();
    }, []);

    const filteredNotifications =
        activeTab === 'Unread'
            ? notifications.filter(n => n.unread)
            : notifications;

    const handleNotificationClick = (id) => {
        console.log(`Notification ${id} clicked`);
        setNotifications(prev =>
            prev.map(n => n.id === id ? { ...n, unread: false } : n)
        );
    };

    if (!isOpen) return null;

    return (
        <div className="notification-modal-overlay show" onClick={(e) => e.target.classList.contains('notification-modal-overlay') && onClose()}>
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
                                <NotificationItem
                                    key={notif.id}
                                    id={notif.id}
                                    sender={notif.sender}
                                    message={notif.message}
                                    time={notif.time}
                                    unread={notif.unread}
                                    avatarUrl={avatars[notif.id]}
                                    onClick={() => handleNotificationClick(notif.id)}
                                />
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
