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
  const [newBackground, setNewBackground] = useState(null);
  const backgroundPreviewUrl = useRef(null);
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

        const [followersRes, followingRes] = await Promise.all([
          axios.get(`https://cookeat.cookeat.space/user/followers/${data.public_id}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`https://cookeat.cookeat.space/user/followings/${data.public_id}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const actualFollowersCount = followersRes.data.followers?.length || 0;
        const actualFollowingCount = followingRes.data.followings?.length || 0;

        const avatarPath = data.profile || data.picture || '';
        const avatarUrl = avatarPath.startsWith('http')
          ? avatarPath
          : avatarPath
            ? `https://cookeat.cookeat.space/media/profile/${avatarPath}`
            : 'https://www.w3schools.com/howto/img_avatar.png';

        const backgroundPath = data.background || ''; // assuming backend uses 'background' for bg image
        const backgroundUrl = backgroundPath.startsWith('http')
          ? backgroundPath
          : backgroundPath
            ? `https://cookeat.cookeat.space/media/background/${backgroundPath}`
            : 'https://media.cnn.com/api/v1/images/stellar/prod/gettyimages-1273516682.jpg?c=original';

        const fetchedProfile = {
          avatar: avatarUrl,
          background: backgroundUrl,
          username: data.username || username,
          postsCount: data.postsCount || 0,
          followersCount: actualFollowersCount,
          followingCount: actualFollowingCount,
          bio: data.biography || 'Welcome to CookEat! Start sharing your delicious creations.',
        };

        setNewUsername(fetchedProfile.username);
        setNewBio(fetchedProfile.bio);
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
        
        setNewUsername(fallbackProfile.username); 
        setNewBio(fallbackProfile.bio); 
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
      if (backgroundPreviewUrl.current) {
        URL.revokeObjectURL(backgroundPreviewUrl.current);
      }
      if (avatarPreviewUrl.current) {
        URL.revokeObjectURL(avatarPreviewUrl.current);
      }
    };
  }, []);
    
  let backgroundSrc = profile.background || null;
  if (newBackground) {
    if (backgroundPreviewUrl.current) {
      URL.revokeObjectURL(backgroundPreviewUrl.current);
    }
    backgroundPreviewUrl.current = URL.createObjectURL(newBackground);
    backgroundSrc = backgroundPreviewUrl.current;
  }

  const handleSaveProfile = async () => {
    const token = localStorage.getItem('token');
    if (!token) return alert('Not logged in.');

    const formData = new FormData();
    formData.append('username', newUsername);
    formData.append('biography', newBio);
    if (newAvatar) {
      formData.append('profile', newAvatar);
      console.log('Sending avatar to backend:', newAvatar.name, newAvatar.type);
    }
    if (newBackground) {
      formData.append('background', newBackground);
      console.log('Sending background to backend:', newBackground.name, newBackground.type);
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

        const [followersRes, followingRes] = await Promise.all([
            axios.get(`https://cookeat.cookeat.space/user/followers/${updated.public_id}`, {
              headers: { Authorization: `Bearer ${token}` },
            }),
            axios.get(`https://cookeat.cookeat.space/user/followings/${updated.public_id}`, {
              headers: { Authorization: `Bearer ${token}` },
            }),
          ]);

        const actualFollowersCount = followersRes.data.followers?.length || 0;
        const actualFollowingCount = followingRes.data.followings?.length || 0;

        const updatedProfile = {
          avatar: avatarUrl,
          username: updated.username || newUsername,
          postsCount: updated.postsCount || profile.postsCount || 0,
          followersCount: actualFollowersCount,
          followingCount: actualFollowingCount,
          bio: updated.biography || newBio,
        };

        setProfile(updatedProfile);
        updatePostsCount(updatedProfile.postsCount);
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

  const updatePostsCount = (count) => {
    setProfile((prev) => {
      const updatedProfile = { ...prev, postsCount: count };
      localStorage.setItem('profile', JSON.stringify(updatedProfile));
      return updatedProfile;
    });
  };

  const refreshFollowersCount = async () => {
  try {
    const token = localStorage.getItem('token');
    const publicId = localStorage.getItem('public_id');

    const followersRes = await axios.get(
      `https://cookeat.cookeat.space/user/followers/${publicId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const count = followersRes.data.followers?.length || 0;

    setProfile((prev) => {
      const updated = { ...prev, followersCount: count };
      localStorage.setItem('profile', JSON.stringify(updated));
      return updated;
    });
  } catch (err) {
    console.error('Failed to refresh followers count:', err);
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
      <div className="profile-cover-photo" style={{
          backgroundImage: backgroundSrc ? `url(${backgroundSrc})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
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
                <label htmlFor="background-upload" style={{ marginTop: '10px', display: 'block' }}>
                  Change Cover Photo:
                </label>
                  <input
                    id="background-upload"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setNewBackground(e.target.files[0])}
                  />
                <label htmlFor="background-upload" style={{ marginTop: '10px', display: 'block' }}>
                  Change Profile Image:
                </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setNewAvatar(e.target.files[0])}
                  />
                <label htmlFor="background-upload" style={{ marginTop: '10px', display: 'block' }}>
                  Change Username:
                </label>
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="Enter new username"
                    autoFocus
                  />
                <label htmlFor="background-upload" style={{ marginTop: '10px', display: 'block' }}>
                  Edit Bio:
                </label>
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

          <div className="tab-content-container">
            {activeTab === 'posts' && <MyFeedPage setPostCount={(count) => {
              console.log("🟢 Updated post count:", count);
                setProfile(prev => {
                  const updated = { ...prev, postsCount: count };
                  localStorage.setItem('profile', JSON.stringify(updated));
                  return updated;
                });
              }} />}
            {activeTab === 'saved' && <div className="saved-content"><p>Saved posts will appear here.</p></div>}
            {activeTab === 'followers' && (
              <div className="followers-content">
                <Followers
                  public_id={localStorage.getItem('public_id')}
                  setFollowersCount={(count) => {
                    setProfile((prev) => {
                      const updatedProfile = { ...prev, followersCount: count };
                      localStorage.setItem('profile', JSON.stringify(updatedProfile));
                      return updatedProfile;
                    });
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default Profile;
