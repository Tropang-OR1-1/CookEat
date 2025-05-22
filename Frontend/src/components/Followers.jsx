import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './styles/followers.css';

function Followers({ public_id, setFollowersCount }) {
  const [followers, setFollowers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFollowers = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`https://cookeat.cookeat.space/user/followers/${public_id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const normalizedFollowers = (res.data.followers || []).map(follower => ({
          ...follower,
          public_id: follower.public_id.trim().toLowerCase(),
          username: follower.username.trim(),
          picture: follower.picture,
        }));

        setFollowers(normalizedFollowers);
        if (typeof setFollowersCount === 'function') {
          setFollowersCount(normalizedFollowers.length);
        }
      } catch (err) {
        setError('Failed to load followers.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchFollowers();
  }, [public_id]);

  if (loading) return <p>Loading followers...</p>;
  if (error) return <p>{error}</p>;

  const myPublicId = (localStorage.getItem('public_id') || '').trim().toLowerCase();

  return (
    <div className="followers-list">
      {followers.length === 0 ? (
        <p>This user has no followers yet.</p>
      ) : (
        followers.map((follower) => {
          const profileLink = follower.public_id === myPublicId ? '/profile' : `/user/${follower.public_id}`;

          return (
            <div key={follower.public_id} className="follower-card">
              <Link to={profileLink} className="follower-link">
                <img
                  src={
                    follower.picture
                      ? `https://cookeat.cookeat.space/media/profile/${follower.picture}`
                      : 'https://www.w3schools.com/howto/img_avatar.png'
                  }
                  alt={`${follower.username}'s avatar`}
                  className="follower-avatar"
                />
                <span>{follower.username}</span>
              </Link>
            </div>
          );
        })
      )}
    </div>
  );
}

export default Followers;
