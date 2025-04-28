import React, { useState } from 'react';
import './FeedPost.css';  // FeedPost styles
import axios from 'axios';  // For making API requests

function FeedPost({
  profileImage,
  username,
  time,
  caption,
  mediaType,
  mediaSrc,
  ingredients,
  instructions,
  postId,
  initialLikes,
  initialComments
}) {
  const [likes, setLikes] = useState(initialLikes);
  const [comments, setComments] = useState(initialComments);
  const [reaction, setReaction] = useState(null);  // Track the user's reaction
  const [isReacted, setIsReacted] = useState(false);  // Track if the user has reacted
  const [commentModalOpen, setCommentModalOpen] = useState(false); // Track if the comment modal is open
  const [newComment, setNewComment] = useState('');  // Track new comment input
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token')); // Check if user is logged in

  const handleReaction = async (reactionType) => {
    if (!isLoggedIn) {
      alert('Please log in to react to this post!');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        '/api/reactions/post', 
        { reaction: reactionType, post_id: postId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.status === 200) {
        setReaction(reactionType);
        setIsReacted(true);
        setLikes((prevLikes) => reactionType === 'like' ? prevLikes + 1 : prevLikes - 1);
      }
    } catch (error) {
      console.error('Error reacting to the post:', error);
    }
  };

  const handleCommentClick = () => {
    if (!isLoggedIn) {
      alert('Please log in to comment on this post!');
      return;
    }
    setCommentModalOpen(true);
  };

  const handleCommentSubmit = async () => {
    if (!newComment.trim()) {
      alert('Please enter a comment!');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `/api/comments/post`, 
        { post_id: postId, content: newComment },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.status === 200) {
        setComments((prevComments) => prevComments + 1);
        setNewComment('');
        setCommentModalOpen(false);  // Close the modal after submitting
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
    }
  };

  return (
    <div className="feed-post">
      {/* Profile Section */}
      <div className="profile-section">
        <div className="profile-left">
          <img src={profileImage} alt="Profile" className="profile-img" />
          <div className="profile-info">
            <p className="username">{username}</p>
            <p className="time">{time}</p>
          </div>
        </div>
        <div className="options">
          <button className="dropdown-btn">⋮</button>
          <div className="dropdown-content">
            <a href="#">Edit</a>
            <a href="#">Delete</a>
          </div>
        </div>
      </div>

      {/* Post Caption */}
      <div className="post-caption">
        <p className="caption">{caption}</p>
      </div>

      {/* Media Container */}
      <div className="media-container">
        {mediaType === 'image' ? (
          <img src={mediaSrc} alt="Post Media" />
        ) : (
          <video controls>
            <source src={mediaSrc} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        )}
      </div>

      {/* Recipe Details */}
      <div className="recipe-details">
        <div className="ingredients">
          <h4>Ingredients:</h4>
          <ul>
            {ingredients.map((ingredient, index) => (
              <li key={index}>{ingredient}</li>
            ))}
          </ul>
        </div>
        <div className="instructions">
          <h4>Instructions:</h4>
          <ol>
            {instructions.map((instruction, index) => (
              <li key={index}>{instruction}</li>
            ))}
          </ol>
        </div>
      </div>

      {/* Engagement Section */}
      <div className="engagement">
        <div className="engagement-buttons">
          <button
            className={`like-btn ${reaction === 'like' ? 'reacted' : ''}`}
            onClick={() => handleReaction(reaction === 'like' ? 'unlike' : 'like')}
            disabled={!isLoggedIn}
          >
            Like ({likes})
          </button>
          <button className="comment-btn" onClick={handleCommentClick} disabled={!isLoggedIn}>
            Comment ({comments})
          </button>
          <button className="share-btn">Share</button>
        </div>
      </div>

      {/* Comment Modal */}
      {commentModalOpen && (
        <div className="comment-modal">
          <div className="modal-content">
            <h3>Post a Comment</h3>
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write your comment..."
            />
            <div className="modal-actions">
              <button onClick={handleCommentSubmit}>Submit</button>
              <button onClick={() => setCommentModalOpen(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FeedPost;
