import React, { useState, useEffect } from 'react';
import axios from 'axios';
import FeedPost from './../components/FeedPost.jsx';
import { useParams } from 'react-router-dom';
import './styles/OtherUserProfile.css';

function OtherUserProfile() {
  const { public_id } = useParams();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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

    const fetchProfileAndPosts = async () => {
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
        });

        // Fetch posts
        const postsRes = await axios.get(`https://cookeat.cookeat.space/user/${public_id}/posts`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const rawPosts = postsRes.data.posts || [];

        const formattedPosts = rawPosts.map(post => ({
          ...post,
          mediaItems: (post.media || []).map(m => ({
            type: m.type,
            src: `https://cookeat.cookeat.space/media/recipe/${m.filename}`,
          })),
          ingredients: post.ingredients || [],
          instructions: post.instructions || [],
        }));

        setPosts(formattedPosts);

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

    fetchProfileAndPosts();
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
    <div className="profile-page-container">
      <main className="profile-content">
        <header className="profile-header">
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

        <nav className="profile-tabs">
          <button disabled>Posts</button>
          <button disabled>Saved</button>
          <button disabled>Followers</button>
        </nav>

        <div className="posts-grid">
          {posts.length === 0 ? (
            <p>No posts available.</p>
          ) : (
            posts.map(post => (
              <FeedPost
                key={post.id}
                profileImage={profile.avatar}
                username={profile.username}
                time={post.created_at}
                caption={post.caption}
                media={post.mediaItems}
                ingredients={post.ingredients}
                instructions={post.instructions}
                likes={post.likes}
                comments={post.comments || []}
                author_public_id={post.author_public_id}
              />
            ))
          )}
        </div>
      </main>
    </div>
  );
}

export default OtherUserProfile;
