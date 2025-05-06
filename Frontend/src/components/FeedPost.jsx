import React, { forwardRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './styles/feedpost.css';

// Constants for reactions
const REACTIONS = {
  LIKE: 'UP',
  UNLIKE: 'NEUTRAL',
};

const FeedPost = forwardRef(({
  public_id,
  title,
  content,
  view_count, // maybe will not use
  created_at,
  updated_at, // for auditing, maybe will not use
  media_filename,
  media_type,
  reactions_count,
  ref_public_id, // pub id if shared
  author_public_id, // pub id used to view user profile
  author_username,
  author_picture,
}, ref) => {
  const [likes, setLikes] = useState(reactions_count); // Set initial likes to reactions_count
  const [comments, setComments] = useState(0); // Start with 0 comments
  const [reaction, setReaction] = useState(null);
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
  const [isReacting, setIsReacting] = useState(false); // Prevent spamming reactions
  const loggedInUsername = localStorage.getItem('username');

  useEffect(() => {
    // Fetch comment count from the API
    const fetchCommentCount = async () => {
      try {
        const token = localStorage.getItem('token'); // Get token from localStorage
        const response = await axios.get(`https://cookeat.cookeat.space/comments/${public_id}`, {
          params: { post_id: public_id },
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.status === 200) {
          setComments(response.data.comment_count); // Assuming response contains comment_count
        }
      } catch (error) {
        console.error('Error fetching comment count:', error);
      }
    };

    fetchCommentCount();
  }, [public_id]);

  const handleReaction = async () => {
    if (!isLoggedIn) {
      alert('Please log in to react to this post!');
      return;
    }

    if (isReacting) return; // Prevent multiple reactions at once
    setIsReacting(true); // Set the reaction to loading state

    const token = localStorage.getItem('token');
    const newReaction = reaction === REACTIONS.LIKE ? REACTIONS.UNLIKE : REACTIONS.LIKE;

    try {
      const response = await axios.post(
        `https://cookeat.cookeat.space/react/post`,
        [newReaction],
        {
          params: { post_id: public_id },
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.status === 200) {
        if (newReaction === REACTIONS.LIKE) {
          setReaction('like');
          setLikes((prevLikes) => prevLikes + 1);
        } else {
          setReaction(null);
          setLikes((prevLikes) => Math.max(0, prevLikes - 1));
        }
      }
    } catch (error) {
      console.error('Error reacting to the post:', error);
    } finally {
      setIsReacting(false); // Reset the loading state after reaction
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
        post_id: public_id,
        comment: newComment,
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

  const profileImageUrl = `https://cookeat.cookeat.space/media/profile/${author_picture}`;
  const mediaUrl = media_filename ? `https://cookeat.cookeat.space/media/posts/${media_filename}` : null;

  const formatDate = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now - date) / 1000);
  
    if (diffInSeconds < 60) {
      return 'just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} min${minutes > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hr${hours > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} wk${days > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 2592000) {
      const months = Math.floor(diffInSeconds / 2592000);
      return `${months} mth${months > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 31536000) {
      const years = Math.floor(diffInSeconds / 31536000);
      return `${years} yr${years > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleString(); // Full date (e.g., "January 1, 2022, 12:00 PM")
    }
  };  

  return (
    <div className="feed-post" ref={ref}>
      {/* Profile Section */}
      <div className="profile-section">
        <div className="profile-left">
          <img src={profileImageUrl} alt="Profile" className="profile-img" />
          <div className="profile-info">
            <p className="author_username">{author_username}</p>
            <p className="time">{formatDate(created_at)}</p>
          </div>
        </div>

        {isLoggedIn && author_username === loggedInUsername && (
          <div className="options">
            <button className="dropdown-btn">⋮</button>
            <div className="dropdown-content">
              <Link to={`/edit/${public_id}`}>Edit</Link>
              <Link to={`/delete/${public_id}`}>Delete</Link>
            </div>
          </div>
        )}
      </div>

      {/* Title */}
      {title && (
        <div className="post-title">
          <h3>{title}</h3>
        </div>
      )}

      {/* Caption / Content */}
      {content && (
        <div className="post-caption">
          <p className="caption">{content}</p>
        </div>
      )}

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

      {/* Engagement Section */}
      <div className="engagement-buttons">
        <div className="engagement-button-group">
          <span className="count">{likes}</span>
          <button
            className={`like-btn ${reaction === 'like' ? 'reacted' : ''}`}
            onClick={handleReaction}
            disabled={!isLoggedIn || isReacting}
          >
            Like
          </button>
        </div>

        <div className="engagement-button-group">
          <span className="count">{comments}</span>
          <button
            className="comment-btn"
            onClick={handleCommentClick}
            disabled={!isLoggedIn}
          >
            Comment
          </button>
        </div>

        {/* New div added here */}
        <div className="engagement-separator"></div>

        <div className="engagement-button-group">
          {/* No count for shares */}
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
