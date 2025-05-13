import React, { useState } from 'react';
import axios from 'axios';
import './styles/engagementcontrols.css';

const REACTIONS = {
  LIKE: 'UP',
  UNLIKE: 'NEUTRAL',
};

const EngagementControls = ({
  public_id,
  title,
  content,
  created_at,
  updated_at,
  view_count,
  media_filename,
  media_type,
  reactions_total,
  user_reacted,
  comment_count,
  ref_public_id,
  author_public_id,
  author_username,
  author_picture,
  isLoggedIn,
}) => {
  const [reaction, setReaction] = useState(user_reacted === 'UP' ? 'like' : null);
  const [newComment, setNewComment] = useState('');
  const [isReacting, setIsReacting] = useState(false);
  const [isCommenting, setIsCommenting] = useState(false);

  const handleReaction = async () => {
    if (!isLoggedIn) {
      alert('Please log in to react to this post!');
      return;
    }

    if (isReacting) return;
    setIsReacting(true);

    const token = localStorage.getItem('token');
    const newReaction = reaction === 'like' ? REACTIONS.UNLIKE : REACTIONS.LIKE;

    try {
      const response = await axios.post(
        'https://cookeat.cookeat.space/react/post',
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
        setReaction(newReaction === REACTIONS.LIKE ? 'like' : null);
      }
    } catch (error) {
      console.error('Error reacting to the post:', error);
    } finally {
      setIsReacting(false);
    }
  };

  const handleCommentClick = () => {
    if (!isLoggedIn) {
      alert('Please log in to comment on this post!');
      return;
    }
    setIsCommenting(true);
  };

  const handleCommentSubmit = async () => {
    if (!newComment.trim()) {
      alert('Please enter a comment!');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'https://cookeat.cookeat.space/feed/comments',
        {
          post_id: public_id,
          comment: newComment,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.status === 200) {
        setNewComment('');
        setIsCommenting(false);
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
    }
  };

  return (
    <div className="engagement-buttons">
      <div className="engagement-button-group">
        <span className="count">{reactions_total}</span>
        <button
          className={`like-btn ${reaction === 'like' ? 'reacted' : ''}`}
          onClick={handleReaction}
          disabled={!isLoggedIn || isReacting}
        >
          Like
        </button>
      </div>

      <div className="engagement-button-group">
        <span className="count">{comment_count}</span>
        <button
          className="comment-btn"
          onClick={handleCommentClick}
          disabled={!isLoggedIn || isCommenting}
        >
          Comment
        </button>
      </div>

      {/* Comment Modal */}
      {isCommenting && (
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
              <button onClick={() => setIsCommenting(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EngagementControls;
