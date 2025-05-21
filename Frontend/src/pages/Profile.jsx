import { jwtDecode } from 'jwt-decode';
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import MyFeedPage from './../pages/MyFeedPage.jsx';
import Followers from '../components/Followers';
import './styles/profile.css';

function Profile({ profile, setProfile }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isEditing, setIsEditing] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newAvatar, setNewAvatar] = useState(null);
  const [newBio, setNewBio] = useState('');
  const [activeTab, setActiveTab] = useState('posts');

  const avatarPreviewUrl = useRef(null);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);

      let storedProfile = localStorage.getItem('profile');
      let username = localStorage.getItem('username') || 'New User';

      if (!profile && storedProfile) {
        try {
          const parsedProfile = JSON.parse(storedProfile);
          setProfile({
            ...parsedProfile,
            avatar: parsedProfile.avatar || 'https://www.w3schools.com/howto/img_avatar.png',
          });
          setLoading(false);
          return;
        } catch (e) {
          console.warn('Failed to parse local profile, refetching', e);
        }
      }

      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('https://cookeat.cookeat.space/user/profile/me', {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = response.data.Profile || {};

        if (data.username) {
          username = data.username;
        }

        if (data.public_id) {
          localStorage.setItem('public_id', data.public_id);
        }

        const avatarPath = data.profile || data.picture || '';
        const avatarUrl = avatarPath.startsWith('http')
          ? avatarPath
          : avatarPath
            ? `https://cookeat.cookeat.space/media/profile/${avatarPath}`
            : 'https://www.w3schools.com/howto/img_avatar.png';

        const fetchedProfile = {
          avatar: avatarUrl,
          username: data.username || username,
          postsCount: data.postsCount || 0,
          followersCount: data.followersCount || 0,
          followingCount: data.followingCount || 0,
          bio: data.biography || 'Welcome to CookEat! Start sharing your delicious creations.',
        };

        setProfile(fetchedProfile);
        localStorage.setItem('profile', JSON.stringify(fetchedProfile));
      } catch (err) {
        console.warn('Could not fetch profile from backend, trying token instead.', err);
        const token = localStorage.getItem('token');

        if (token) {
          try {
            const decoded = jwtDecode(token);
            username = decoded.username || username;
            if (decoded.public_id) {
              localStorage.setItem('public_id', decoded.public_id);
            }
          } catch (decodeErr) {
            console.warn('Token decode failed:', decodeErr);
          }
        }

        const fallbackProfile = {
          avatar: 'https://www.w3schools.com/howto/img_avatar.png',
          username,
          postsCount: 0,
          followersCount: 0,
          followingCount: 0,
          bio: 'Welcome to CookEat! Start sharing your delicious creations.',
        };

        setProfile(fallbackProfile);
        localStorage.setItem('profile', JSON.stringify(fallbackProfile));
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [setProfile]);

  useEffect(() => {
    return () => {
      if (avatarPreviewUrl.current) {
        URL.revokeObjectURL(avatarPreviewUrl.current);
      }
    };
  }, []);

  const handleSaveProfile = async () => {
    const token = localStorage.getItem('token');
    if (!token) return alert('Not logged in.');

    const formData = new FormData();
    formData.append('username', newUsername);
    formData.append('biography', newBio);
    if (newAvatar) {
      formData.append('profile', newAvatar);
      console.log('✔️ Sending avatar to backend:', newAvatar.name, newAvatar.type);
    }

    try {
      const response = await axios.post('https://cookeat.cookeat.space/user/profile', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.message?.toLowerCase().includes("updated")) {
        alert('Profile updated successfully.');

        const updatedProfileRes = await axios.get('https://cookeat.cookeat.space/user/profile/me', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const updated = updatedProfileRes.data.Profile || {};
        const avatarPath = updated.profile || updated.picture || '';
        const avatarUrl = avatarPath.startsWith('http')
          ? avatarPath
          : avatarPath
            ? `https://cookeat.cookeat.space/media/profile/${avatarPath}`
            : 'https://www.w3schools.com/howto/img_avatar.png';

        const updatedProfile = {
          avatar: avatarUrl,
          username: updated.username || newUsername,
          postsCount: updated.postsCount || 0,
          followersCount: updated.followersCount || 0,
          followingCount: updated.followingCount || 0,
          bio: updated.biography || newBio,
        };

        setProfile(updatedProfile);
        localStorage.setItem('profile', JSON.stringify(updatedProfile));
        setIsEditing(false);
        setNewAvatar(null);
      } else {
        alert('Failed to update profile.');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile.');
    }
  };

  if (loading || !profile) return <div>Loading...</div>;

  let avatarSrc = profile.avatar || 'https://www.w3schools.com/howto/img_avatar.png';
  if (newAvatar) {
    if (avatarPreviewUrl.current) {
      URL.revokeObjectURL(avatarPreviewUrl.current);
    }
    avatarPreviewUrl.current = URL.createObjectURL(newAvatar);
    avatarSrc = avatarPreviewUrl.current;
  }

  return (
    <div className="profile-page-container with-cover">
      <div className="profile-cover-photo" />
      <main className="profile-content">
        <div className="profile-body">
          <header className="profile-header with-cover">
            <div className="profile-image">
              <img
                src={avatarSrc}
                alt="Profile"
                className="profile-avatar"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://www.w3schools.com/howto/img_avatar.png';
                }}
                onLoad={(e) => {
                  e.target.style.opacity = 1;
                }}
              />
            </div>
            <div className="profile-info">
              {isEditing ? (
                <>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setNewAvatar(e.target.files[0])}
                  />
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="Enter new username"
                    autoFocus
                  />
                  <textarea
                    value={newBio}
                    onChange={(e) => setNewBio(e.target.value)}
                    placeholder="Enter new biography"
                  />
                </>
              ) : (
                <>
                  <h1 className="username">{profile.username}</h1>
                  <p>{profile.bio}</p>
                </>
              )}

              <div className="stats">
                <span><strong>{profile.postsCount}</strong> Posts</span>
                <span><strong>{profile.followersCount}</strong> Followers</span>
                <span><strong>{profile.followingCount}</strong> Following</span>
              </div>

              <button
                className="edit-profile-btn"
                onClick={() => {
                  if (isEditing) {
                    handleSaveProfile();
                  } else {
                    setNewUsername(profile.username);
                    setNewBio(profile.bio);
                    setNewAvatar(null);
                    setIsEditing(true);
                  }
                }}
              >
                {isEditing ? 'Save' : 'Edit Profile'}
              </button>
            </div>
          </header>

          <nav className="profile-tabs">
            <button className={activeTab === 'posts' ? 'active' : ''} onClick={() => setActiveTab('posts')}>Posts</button>
            <button className={activeTab === 'saved' ? 'active' : ''} onClick={() => setActiveTab('saved')}>Saved</button>
            <button className={activeTab === 'followers' ? 'active' : ''} onClick={() => setActiveTab('followers')}>Followers</button>
          </nav>

          <div className="tab-content-container">
            {activeTab === 'posts' && <MyFeedPage />}
            {activeTab === 'saved' && <div className="saved-content"><p>Saved posts will appear here.</p></div>}
            {activeTab === 'followers' && <div className="followers-content"><Followers public_id={localStorage.getItem('public_id')} /></div>}
          </div>
        </div>
      </main>
    </div>
  );
}

export default Profile;
