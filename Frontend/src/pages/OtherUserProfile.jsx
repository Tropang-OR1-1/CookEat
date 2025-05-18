import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import OtherUserFeedPage from './OtherUserFeedPage.jsx';
import './styles/Profile.css';

function OtherUserProfile() {
  const { public_id } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('posts');
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const myPublicId = localStorage.getItem('public_id');
  const isOwnProfile = myPublicId === public_id;
  const isLoggedIn = !!localStorage.getItem('token');

  useEffect(() => {
    if (!public_id) {
      setError('No user specified');
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');

        // Fetch profile
        const profileRes = await axios.get(`https://cookeat.cookeat.space/user/profile/${public_id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = profileRes.data.Profile;
        if (!data) {
          setError('Profile not found');
          setLoading(false);
          return;
        }

        setProfile({
          avatar: data.picture
            ? `https://cookeat.cookeat.space/media/profile/${data.picture}`
            : 'https://www.w3schools.com/howto/img_avatar.png',
          username: data.username,
          postsCount: data.postsCount || 0,
          followersCount: data.followersCount || 0,
          followingCount: data.followingCount || 0,
          bio: data.biography || 'This user has no biography.',
          coverPhoto: data.coverPhoto
            ? `https://cookeat.cookeat.space/media/profile/${data.coverPhoto}`
            : 'https://images.unsplash.com/photo-1503264116251-35a269479413?auto=format&fit=crop&w=1350&q=80',
        });

        // Fetch follow status
        if (isLoggedIn && !isOwnProfile) {
          const followingsRes = await axios.get(`https://cookeat.cookeat.space/user/followings/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          const followings = followingsRes.data.followings || [];
          setIsFollowing(followings.some(user => user.public_id === public_id));
        }

        setLoading(false);
      } catch (err) {
        console.error('Error loading profile:', err);
        setError('Failed to load profile.');
        setLoading(false);
      }
    };

    fetchProfile();
  }, [public_id, isLoggedIn, isOwnProfile]);

  const handleFollow = async () => {
    if (isOwnProfile) return;
    setFollowLoading(true);

    try {
      await axios.post(
        `https://cookeat.cookeat.space/user/follow/${public_id}`,
        {},
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }
      );
      setIsFollowing(true);
      setProfile(prev => ({ ...prev, followersCount: prev.followersCount + 1 }));
    } catch {
      alert('Failed to follow user.');
    }

    setFollowLoading(false);
  };

  const handleUnfollow = async () => {
    if (isOwnProfile) return;
    setFollowLoading(true);

    try {
      await axios.post(
        `https://cookeat.cookeat.space/user/unfollow/${public_id}`,
        {},
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }
      );
      setIsFollowing(false);
      setProfile(prev => ({ ...prev, followersCount: prev.followersCount - 1 }));
    } catch {
      alert('Failed to unfollow user.');
    }

    setFollowLoading(false);
  };

  if (loading) return <div>Loading profile...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className={`profile-page-container with-cover`}>
      <div className="profile-cover-photo"/>

      <main className="profile-content">
        <div className='profile-body'>
          <header className="profile-header with-cover">
            <div className="profile-image">
              <img
                src={profile.avatar}
                alt={`${profile.username}'s avatar`}
                className="profile-avatar"
              />
            </div>
            <div className="profile-info">
              <h1 className="username">{profile.username}</h1>
              <p>{profile.bio}</p>

              <div className="stats">
                <span><strong>{profile.postsCount}</strong> Posts</span>
                <span><strong>{profile.followersCount}</strong> Followers</span>
                <span><strong>{profile.followingCount}</strong> Following</span>
              </div>

              {!isOwnProfile && isLoggedIn && (
                isFollowing ? (
                  <button
                    className="edit-profile-btn"
                    onClick={handleUnfollow}
                    disabled={followLoading}
                    style={{ backgroundColor: '#FF7043' }}
                  >
                    {followLoading ? 'Unfollowing...' : 'Unfollow'}
                  </button>
                ) : (
                  <button
                    className="edit-profile-btn"
                    onClick={handleFollow}
                    disabled={followLoading}
                  >
                    {followLoading ? 'Following...' : 'Follow'}
                  </button>
                )
              )}
            </div>
          </header>

          {/* 👇 Tab navigation */}
          <nav className="profile-tabs">
            <button
              className={activeTab === 'posts' ? 'active' : ''}
              onClick={() => setActiveTab('posts')}
            >
              Posts
            </button>
            <button
              className={activeTab === 'saved' ? 'active' : ''}
              onClick={() => setActiveTab('saved')}
            >
              Saved
            </button>
            <button
              className={activeTab === 'followers' ? 'active' : ''}
              onClick={() => setActiveTab('followers')}
            >
              Followers
            </button>
          </nav>

          {/* 👇 Tab content container */}
          <div className="tab-content-container">
            {activeTab === 'posts' && (
              <OtherUserFeedPage key="posts" public_id={public_id} />
            )}

            {activeTab === 'saved' && (
              <div className="saved-content">
                <p>This user's saved posts will appear here.</p>
              </div>
            )}

            {activeTab === 'followers' && (
              <div className="followers-content">
                <p>This user's followers list will appear here.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default OtherUserProfile;
