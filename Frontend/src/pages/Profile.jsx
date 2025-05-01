import { jwtDecode } from 'jwt-decode';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import FeedPost from './FeedPost';
import './styles/profile.css';

function Profile() {
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isEditing, setIsEditing] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newAvatar, setNewAvatar] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const storedProfile = localStorage.getItem('profile');
      let username = localStorage.getItem('username') || 'New User';

      if (storedProfile) {
        setProfile(JSON.parse(storedProfile));
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get('https://cookeat.cookeat.space/user/profile/me', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });

        if (response.data.Profile?.username) {
          username = response.data.Profile.username;
        }

        const defaultProfile = {
          avatar: 'https://www.w3schools.com/howto/img_avatar.png',
          username: username,
          postsCount: 0,
          followersCount: 0,
          followingCount: 0,
          bio: 'Welcome to CookEat! Start sharing your delicious creations.',
        };

        setProfile(defaultProfile);
        setPosts([]);
        setLoading(false);
      } catch (err) {
        console.warn('Could not fetch username from backend, trying token instead.');
        const token = localStorage.getItem('token');
        if (token) {
          try {
            const decoded = jwtDecode(token);
            username = decoded.username || username;
          } catch (decodeErr) {
            console.warn('Token decode failed:', decodeErr);
          }
        }

        const defaultProfile = {
          avatar: 'https://www.w3schools.com/howto/img_avatar.png',
          username: username,
          postsCount: 0,
          followersCount: 0,
          followingCount: 0,
          bio: 'Welcome to CookEat! Start sharing your delicious creations.',
        };

        setProfile(defaultProfile);
        setPosts([]);
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleSaveProfile = async () => {
    const token = localStorage.getItem('token');
    if (!token) return alert("Not logged in.");
  
    const formData = new FormData();
    formData.append('username', newUsername);
    
    if (newAvatar) {
      console.log('Appending avatar to form data:', newAvatar);
      formData.append('profile', newAvatar);  // match backend field
    }
  
    try {
      console.log('Sending form data:', formData);
      const response = await axios.post('https://cookeat.cookeat.space/user/profile', formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
  
      console.log('API Response:', response);
  
      if (response.status === 200) {
        alert('Profile updated successfully.');
  
        // Now fetch the updated profile (required to get full avatar URL)
        const updatedProfileRes = await axios.get('https://cookeat.cookeat.space/user/profile/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
  
        const updated = updatedProfileRes.data.Profile;
        const updatedProfile = {
          avatar: updated.picture
            ? `https://cookeat.cookeat.space/media/profile/${updated.picture}`
            : 'https://www.w3schools.com/howto/img_avatar.png',
          username: updated.username,
          postsCount: updated.postsCount || 0,
          followersCount: updated.followersCount || 0,
          followingCount: updated.followingCount || 0,
          bio: updated.biography || 'Welcome to CookEat! Start sharing your delicious creations.',
        };
  
        setProfile(updatedProfile);
        localStorage.setItem('profile', JSON.stringify(updatedProfile));
      } else {
        alert('Failed to update profile.');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile.');
    }
  };
  

  if (loading) return <div>Loading...</div>;

  return (
    <div className="profile-page-container">
      <main className="profile-content">
        <header className="profile-header">
          <div className="profile-image">
            <img
              src={newAvatar ? URL.createObjectURL(newAvatar) : profile.avatar}
              alt="Profile"
              className="profile-avatar"
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
                />
              </>
            ) : (
              <h1 className="username">{profile.username}</h1>
            )}

            <div className="stats">
              <span><strong>{profile.postsCount}</strong> Posts</span>
              <span><strong>{profile.followersCount}</strong> Followers</span>
              <span><strong>{profile.followingCount}</strong> Following</span>
            </div>
            <div className="bio">
              <p>{profile.bio}</p>
            </div>

            <button
              onClick={() => {
                if (isEditing) {
                  handleSaveProfile();
                } else {
                  setNewUsername(profile.username);
                }
                setIsEditing(!isEditing);
              }}
            >
              {isEditing ? 'Save' : 'Edit Profile'}
            </button>
          </div>
        </header>

        <nav className="profile-tabs">
          <button className="active">Posts</button>
          <button>Saved</button>
          <button>Followers</button>
        </nav>

        <div className="posts-grid">
          {posts.length === 0 ? (
            <p>No posts available.</p>
          ) : (
            posts.map(post => (
              <FeedPost
                key={post.id}
                profileImage={profile.avatar || 'placeholder-avatar.png'}
                username={profile.username}
                time={post.time}
                caption={post.caption}
                mediaType={post.mediaType}
                mediaSrc={post.mediaSrc}
                ingredients={post.ingredients || []}
                instructions={post.instructions || []}
                likes={post.likes}
                comments={post.comments}
              />
            ))
          )}
        </div>
      </main>
    </div>
  );
}

export default Profile;
