import React, { useState } from 'react';
import axios from 'axios';
import './styles/engagementcontrols.css';

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
  const [reactionCount, setReactionCount] = useState(reactions_total);
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
    const url = `https://cookeat.cookeat.space/react/post/${public_id}`;

    try {
      if (reaction === 'like') {
        await axios.delete(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        });
        setReaction(null);
        setReactionCount((prev) => prev - 1);
      } else {
        await axios.post(
          url,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          }
        );
        setReaction('like');
        setReactionCount((prev) => prev + 1);
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
    <div className="engagement-controls-grid">
      {/* Top Row */}
      <div className="grid-item top">
        <span className="count-label">{reactionCount} {reactionCount === 1 ? 'Like' : 'Likes'}</span>
      </div>
      <div className="grid-item top">
        <span className="count-label">{comment_count} {comment_count === 1 ? 'Comment' : 'Comments'}</span>
      </div>
      <div className="grid-item top">
        {media_type === 'video/mp4' && (
          <span className="count-label">{view_count} {view_count === 1 ? 'View' : 'Views'}</span>
        )}
      </div>

      {/* Bottom Row */}
      <div className="grid-item bottom">
        <button
          className={`like-btn ${reaction === 'like' ? 'react' : ''}`}
          onClick={handleReaction}
          disabled={!isLoggedIn || isReacting}
        >
          👍 Like
        </button>
      </div>
      <div className="grid-item bottom">
        <button
          className="comment-btn"
          onClick={handleCommentClick}
          disabled={!isLoggedIn || isCommenting}
        >
          💬 Comment
        </button>
      </div>
      <div className="grid-item bottom">
        <button className="share-btn" disabled>
          🔗 Share
        </button>
      </div>

      {/* Comment Modal */}
      {isCommenting && (
        <div className="comment-modal">
          <div className="modal-content">
            <h3>Post a Comment</h3>
            <textarea
              className="comment-textarea"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write your comment..."
            />
            <div className="modal-actions">
              <button className="modal-button submit" onClick={handleCommentSubmit}>Submit</button>
              <button className="modal-button cancel" onClick={() => setIsCommenting(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EngagementControls;
