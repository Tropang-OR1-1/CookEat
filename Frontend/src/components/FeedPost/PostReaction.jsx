import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import './styles/PostReaction.css';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';

const PostReaction = ({
  isOpen,
  onClose,
  reactions_total,
  public_id }) => {
  const [reactedUsers, setReactedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchReactedUsers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(`https://cookeat.cookeat.space/react/post/${public_id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setReactedUsers(response.data.result);
    } catch (error) {
      console.error('Error fetching reacted users:', error);
      setError('Failed to load users who reacted.');
    } finally {
      setLoading(false);
    }
  }, [public_id]);

  useEffect(() => {
    if (isOpen) {
      fetchReactedUsers();
    }
  }, [isOpen, fetchReactedUsers]);

  if (!isOpen) return null;

  
  const skeletonCount = reactions_total > 6 ? 6 : reactions_total;

  return (
    <div className="reaction-overlay">
      <div className="reaction-content">
        <div className="reaction-header">
          <h2>Users Who Liked</h2>
          <div className="close-wrapper">
            <IconButton
              onClick={onClose}
              className="mui-close-button"
              aria-label="Close"
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </div>
        </div>

        {loading && (
          <ul className="skeleton-wrapper">
            {[...Array(skeletonCount)].map((_, idx) => (
              <li className="skeleton-item" key={idx}>
                <div className="skeleton-avatar"></div>
                <div className="skeleton-text"></div>
              </li>
            ))}
          </ul>
        )}

        {error && <p>{error}</p>}

        {!loading && !error && (
          <ul>
            {reactedUsers.map((user) => (
              <li key={user.user_id}>
                <img
                  src={`https://cookeat.cookeat.space/media/profile/${user.user_picture}`}
                  alt={user.username}
                />
                <span>{user.username}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default PostReaction;
