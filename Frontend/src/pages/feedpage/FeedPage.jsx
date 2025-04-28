import React, { useState, useEffect } from 'react';
import FeedPost from './FeedPost';  // Import your FeedPost component
import './FeedPage.css';  // Add styling for the FeedPage

function FeedPage() {
  const [posts, setPosts] = useState([]);  // State to store posts
  const [loading, setLoading] = useState(true);  // State for loading
  const [error, setError] = useState(null);  // State for errors

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await fetch('/api/posts');  // Change to your API endpoint for posts
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
              key={post.id}
              profileImage={post.profileImage} 
              username={post.username}
              time={post.time}
              caption={post.caption}
              mediaType={post.mediaType}
              mediaSrc={post.mediaSrc}
              ingredients={post.ingredients}
              instructions={post.instructions}
              postId={post.id}  // Add postId for use in reactions/comments
              initialLikes={post.likes}
              initialComments={post.comments}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default FeedPage;
