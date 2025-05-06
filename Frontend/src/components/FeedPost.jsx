import React, { forwardRef, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './styles/feedpost.css';

const FeedPost = forwardRef(({
  authorPicture,
  authorUsername,
  time,
  content,
  media_type,
  media_filename,
  ingredients = [],
  instructions = [],
  postId,
  initialLikes,
  initialComments
}, ref) => {
  const [likes, setLikes] = useState(initialLikes);
  const [comments, setComments] = useState(initialComments);
  const [reaction, setReaction] = useState(null);
  const [isReacted, setIsReacted] = useState(false);
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
  const loggedInUsername = localStorage.getItem('username');

  const handleReaction = async (reactionType) => {
    if (!isLoggedIn) {
      alert('Please log in to react to this post!');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('https://cookeat.cookeat.space/feed/reactions/', {
        params: { reaction: reactionType, post_id: postId },
        headers: { Authorization: `Bearer ${token}` },
      });

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
      const response = await axios.post('https://cookeat.cookeat.space/feed/comments', {
        post_id: postId,
        content: newComment,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 200) {
        setComments((prevComments) => prevComments + 1);
        setNewComment('');
        setCommentModalOpen(false);
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
    }
  };

  // Construct the full URLs for images and media
  const profileImageUrl = `https://cookeat.cookeat.space/media/profile/${authorPicture}`;
  const mediaUrl = media_filename ? `https://cookeat.cookeat.space/media/posts/${media_filename}` : null;

  return (
    <div className="feed-post" ref={ref}>
      {/* Profile Section */}
      <div className="profile-section">
        <div className="profile-left">
          <img src={profileImageUrl} alt="Profile" className="profile-img" />
          <div className="profile-info">
            <p className="username">{authorUsername}</p>
            <p className="time">{time}</p>
          </div>
        </div>
        {isLoggedIn && authorUsername === loggedInUsername && (
          <div className="options">
            <button className="dropdown-btn">⋮</button>
            <div className="dropdown-content">
              <Link to={`/edit/${postId}`}>Edit</Link>
              <Link to={`/delete/${postId}`}>Delete</Link>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="post-caption">
        <p className="caption">{content}</p>
      </div>

      {/* Media */}
      <div className="media-container">
        {media_type === 'image' && mediaUrl && <img src={mediaUrl} alt="Post Media" />}
        {media_type === 'video' && mediaUrl && (
          <video controls>
            <source src={mediaUrl} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        )}
      </div>

      {/* Recipe Details */}
      <div className="recipe-details">
        {ingredients.length > 0 && (
          <div className="ingredients">
            <h4>Ingredients:</h4>
            <ul>
              {ingredients.map((ingredient, index) => (
                <li key={index}>{ingredient}</li>
              ))}
            </ul>
          </div>
        )}
        {instructions.length > 0 && (
          <div className="instructions">
            <h4>Instructions:</h4>
            <ol>
              {instructions.map((instruction, index) => (
                <li key={index}>{instruction}</li>
              ))}
            </ol>
          </div>
        )}
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
          <button
            className="comment-btn"
            onClick={handleCommentClick}
            disabled={!isLoggedIn}
          >
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
});

export default FeedPost;
