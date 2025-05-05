import React, { useState, useEffect } from 'react';
import FeedPost from './../components/FeedPost.jsx';

import './styles/feedpage.css';

function FeedPage() {
  const [posts, setPosts] = useState([]);  // State to store posts
  const [loading, setLoading] = useState(true);  // State for loading
  const [error, setError] = useState(null);  // State for errors

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await fetch('https://cookeat.cookeat.space/query/feed/post');
        if (!response.ok) {
          throw new Error('Failed to fetch posts');
        }
        const data = await response.json();
        setPosts(data.posts);  // Assuming the API returns an array of posts
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  // If loading or error occurs
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="feed-page-container">
      <div className="feed-posts">
        {posts.length === 0 ? (
          <p>No posts available.</p>
        ) : (
          posts.map(post => (
            <FeedPost 
              key={post.public_id}
              profileImage={post.author.picture} 
              username={post.author.username}
              time={new Date(post.created_at).toLocaleString()}
              caption={post.title}
              mediaType={post.media[0]?.media_type}
              mediaSrc={`path/to/media/${post.media[0]?.media_filename}`}  // Assuming media is accessible via this path
              reactionsCount={post.reactions_count}
              postId={post.public_id}  // Pass postId
            />
          ))
        )}
      </div>
    </div>
  );
}

export default FeedPage;
