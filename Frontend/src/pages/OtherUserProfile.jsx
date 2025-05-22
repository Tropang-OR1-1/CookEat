import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import OtherUserFeedPage from './OtherUserFeedPage.jsx';
import FollowersList from '../components/Followers.jsx';
import FollowButton from '../components/FollowBtn.jsx';
import './styles/profile.css';

function OtherUserProfile() {
  const { public_id: rawPublicId } = useParams();
  const public_id = rawPublicId?.trim().toLowerCase();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('posts');
  const [postCount, setPostCount] = useState(0);

  const myPublicIdRaw = localStorage.getItem('public_id') || '';
  const myPublicId = myPublicIdRaw.trim().toLowerCase();
  const isOwnProfile = myPublicId === public_id;
  const isLoggedIn = !!localStorage.getItem('token');

  // Reset state when public_id changes
  useEffect(() => {
    setProfile(null);
    setLoading(true);
    setError(null);
  }, [public_id]);

  // Fetch profile and followers/following counts
  useEffect(() => {
    if (!public_id) {
      setError('No user specified');
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');

        const profileRes = await axios.get(
          `https://cookeat.cookeat.space/user/profile/${public_id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const data = profileRes.data.Profile;
        console.log('Full profile response:', profileRes.data);

        if (!data) {
          setError('Profile not found');
          setLoading(false);
          return;
        }

        const [followersRes, followingRes] = await Promise.all([
          axios.get(`https://cookeat.cookeat.space/user/followers/${public_id}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`https://cookeat.cookeat.space/user/followings/${public_id}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const actualFollowersCount = followersRes.data.followers?.length || 0;
        const actualFollowingCount = followingRes.data.followings?.length || 0;

        setProfile({
          avatar: data.picture
            ? `https://cookeat.cookeat.space/media/profile/${data.picture}`
            : 'https://www.w3schools.com/howto/img_avatar.png',
          username: data.username,
          postsCount: data.postsCount || 0,
          followersCount: actualFollowersCount,
          followingCount: actualFollowingCount,
          bio: data.biography || 'This user has no biography.',
          coverPhoto: data.background
            ? `https://cookeat.cookeat.space/media/background/${data.background}?t=${Date.now()}`
            : 'https://media.cnn.com/api/v1/images/stellar/prod/gettyimages-1273516682.jpg?c=original',
          });

        setLoading(false);
      } catch (err) {
        console.error('Error loading profile:', err);
        setError('Failed to load profile.');
        setLoading(false);
      }
    };

    fetchProfile();
  }, [public_id]);

  // Refresh followers count when needed (for Followers tab)
  const refreshFollowersCount = async () => {
    try {
      const token = localStorage.getItem('token');
      const followersRes = await axios.get(
        `https://cookeat.cookeat.space/user/followers/${public_id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const actualFollowersCount = followersRes.data.followers?.length || 0;
      setProfile((prev) => (prev ? { ...prev, followersCount: actualFollowersCount } : prev));
    } catch (err) {
      console.error('Failed to refresh followers count:', err);
    }
  };

  if (loading) return <div>Loading profile...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div key={public_id} className="profile-page-container with-cover">
      <div
        className="profile-cover-photo"
        style={{ backgroundImage: `url(${profile.coverPhoto})` }}
      />

      <main className="profile-content">
        <div className="profile-body">
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
                <span>
                  <strong>{profile.postsCount}</strong> Posts
                </span>
                <span>
                  <strong>{profile.followersCount}</strong> Followers
                </span>
                <span>
                  <strong>{profile.followingCount}</strong> Following
                </span>
              </div>

              <FollowButton
                public_id={public_id}
                isOwnProfile={isOwnProfile}
                onFollowersCountChange={(count) =>
                  setProfile((prev) => (prev ? { ...prev, followersCount: count } : prev))
                }
              />
            </div>
          </header>

          {/* Tab navigation */}
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
              onClick={() => {
                setActiveTab('followers');
                refreshFollowersCount();
              }}
            >
              Followers
            </button>
          </nav>

          {/* Tab content container */}
          <div className="tab-content-container">
            {activeTab === 'posts' && (
              <OtherUserFeedPage
                key="posts"
                public_id={public_id}
                setPostCount={setPostCount}
              />
            )}
            {activeTab === 'saved' && (
              <div className="saved-content">
                <p>This user's saved posts will appear here.</p>
              </div>
            )}

            {activeTab === 'followers' && <FollowersList public_id={public_id} />}
          </div>
        </div>
      </main>
    </div>
  );
}

export default OtherUserProfile;
