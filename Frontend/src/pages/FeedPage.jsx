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
        const response = await fetch('https://cookeat.cookeat.space/query/feed/posts');  // Updated URL

        // Check if the response is OK and contains JSON
        if (!response.ok) {
          throw new Error('Failed to fetch posts');
        }

        const data = await response.json();  // Parse the response as JSON
        console.log("Fetched Data:", data);  // Log to inspect the structure

        if (data && Array.isArray(data.posts)) {
          setPosts(data.posts);  // Set posts from the API response
        } else {
          setError('No posts available or invalid data format');
        }
      } catch (err) {
        setError(err.message);  // Catch and set the error message
      } finally {
        setLoading(false);  // Set loading to false once done
      }
    };

    fetchPosts();
  }, []);

  // If loading or error occurs
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="feed-page-container" style={{ border: '2px solid black' }}> {/* remove style later */}
      <div className="feed-posts">
        {posts.length === 0 ? (
          <p>No posts available.</p>
        ) : (
          posts.map(post => (
            <FeedPost 
              key={post.public_id}
              profileImage={`path/to/profile/${post.author.picture}`}  // Ensure correct path to profile image
              username={post.author.username}
              time={new Date(post.created_at).toLocaleString()}
              caption={post.title}
              mediaType={post.media[0]?.media_type}
              mediaSrc={`path/to/media/${post.media[0]?.media_filename}`}  // Construct media URL
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
