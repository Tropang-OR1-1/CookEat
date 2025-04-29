import React, { useState, useEffect } from 'react';
import axios from 'axios';
import FeedPost from './FeedPost';
import './styles/profile.css'; 

function Profile() {
  // State hooks to store profile data, posts, and loading state
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // useEffect(() => {
  //   const fetchProfile = async () => {
  //     try {
  //       const response = await axios.get('https://cookeat.cookeat.space/user/profile/me', {  
  //         headers: {
  //           'Authorization': `Bearer ${localStorage.getItem('token')}`,
  //         },
  //       });
  //       if (response.data.profile && response.data.posts) {
  //         setProfile(response.data.profile);
  //         setPosts(response.data.posts);
  //       } else {
  //         throw new Error('Profile or posts data missing');
  //       }
  //     } catch (err) {
  //       console.error('Error fetching profile:', err);
  //       setError(err.response?.data?.message || err.message || 'Unknown error');
  //       alert("Failed to load profile. Please check your token or network connection.");
  //     } finally {
  //       setLoading(false);
  //     }
  //   };
  //   fetchProfile();
  // }, []);

  // Simulate fetching profile and posts data
  // This is a placeholder for the actual API call to fetch user profile and posts
  useEffect(() => {
    const fetchProfile = async () => {
      // Simulate sample profile and posts
      const sampleProfile = {
        avatar: 'https://www.w3schools.com/howto/img_avatar.png',  // Example avatar image
        username: 'John Doe',
        postsCount: 10,
        followersCount: 150,
        followingCount: 100,
        bio: 'This is a sample bio for testing purposes.',
      };
      const samplePosts = [
        {
          id: 1,
          time: '2025-04-01',
          caption: 'This is a sample post.',
          mediaType: 'image',
          mediaSrc: 'https://via.placeholder.com/150',
          ingredients: ['ingredient 1', 'ingredient 2'],
          instructions: ['step 1', 'step 2'],
          likes: 50,
          comments: 10,
        },
        // Add more posts if needed
      ];
      
      setProfile(sampleProfile);
      setPosts(samplePosts);
      setLoading(false);
    };
  
    fetchProfile();
  }, []);
  
  // If loading or error occurs
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="profile-page-container">
      {/* Main Content */}
      <main className="profile-content">
        <header className="profile-header">
          <div className="profile-image">
            {/* Use dynamic profile image or fallback to placeholder */}
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
