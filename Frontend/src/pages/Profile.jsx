import React, { useState, useEffect } from 'react';
import axios from 'axios';
import FeedPost from './FeedPost';
import './styles/profile.css';

function Profile() {
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
      const fetchProfile = async () => {
        try {
          const response = await axios.get('https://cookeat.cookeat.space/user/profile/me', {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
          });

          if (response.data.profile && response.data.posts) {
            setProfile(response.data.profile);
            setPosts(response.data.posts);
          } else {
            throw new Error('Profile or posts data missing');
          }
        } catch (err) {
          console.error('Error fetching profile:', err);
          setError(err.response?.data?.message || err.message || 'Unknown error');

          // If fetch fails, load sample data
          const sampleProfile = {
            avatar: 'https://www.w3schools.com/howto/img_avatar.png',
            username: 'Sample User',
            postsCount: 3,
            followersCount: 120,
            followingCount: 80,
            bio: 'This is a fallback sample bio.',
          };

          const samplePosts = [
            {
              id: 1,
              time: '2025-04-01',
              caption: 'Sample post caption 1.',
              mediaType: 'image',
              mediaSrc: 'https://via.placeholder.com/150',
              ingredients: ['ingredient 1', 'ingredient 2'],
              instructions: ['step 1', 'step 2'],
              likes: 10,
              comments: 2,
            },
            {
              id: 2,
              time: '2025-04-02',
              caption: 'Sample post caption 2.',
              mediaType: 'image',
              mediaSrc: 'https://via.placeholder.com/150',
              ingredients: ['ingredient A', 'ingredient B'],
              instructions: ['step A', 'step B'],
              likes: 20,
              comments: 5,
            },
          ];

          setProfile(sampleProfile);
          setPosts(samplePosts);
        } finally {
          setLoading(false);
        }
      };

    fetchProfile();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="profile-page-container">
      <main className="profile-content">
        <header className="profile-header">
          <div className="profile-image">
            <img src={profile.avatar || 'placeholder-avatar.png'} alt="Profile" className="profile-avatar" />
          </div>
          <div className="profile-info">
            <h1 className="username">{profile.username}</h1>
            <div className="stats">
              <span><strong>{profile.postsCount}</strong> Posts</span>
              <span><strong>{profile.followersCount}</strong> Followers</span>
              <span><strong>{profile.followingCount}</strong> Following</span>
            </div>
            <div className="bio">
              <p>{profile.bio}</p>
            </div>
          </div>
        </header>

        {/* Profile Tabs */}
        <nav className="profile-tabs">
          <button className="active">Posts</button>
          <button>Saved</button>
          <button>Followers</button>
        </nav>

        {/* Posts Grid */}
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
