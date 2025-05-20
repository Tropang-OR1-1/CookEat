import React, { useState } from 'react';
import axios from 'axios';
import CommentModal from './CommentModal';
import PostComment from './PostComment';  // Import PostComment component
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
  openLoginModal
}) => {
  const [reaction, setReaction] = useState(user_reacted === 'UP' ? 'like' : null);
  const [reactionCount, setReactionCount] = useState(reactions_total);
  const [isReacting, setIsReacting] = useState(false);
  const [isCommenting, setIsCommenting] = useState(false);
  const [isCommentSectionVisible, setIsCommentSectionVisible] = useState(false);

  const commentCount = Number(comment_count ?? 0);

  const handleReaction = async () => {
    if (!isLoggedIn) {
      openLoginModal();
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
        const formData = new FormData();
        formData.append('react', 'UP');

        await axios.post(url, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
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
      openLoginModal();
      return;
    }
    setIsCommenting(true);
  };

  // Handle clicking on the comment count
  const handleCommentCountClick = () => {
    setIsCommentSectionVisible(!isCommentSectionVisible); // Toggle the visibility of the comments section
  };

  return (
    <div className="engagement-controls-container">
      {/* Engagement controls grid */}
      <div className="engagement-controls-grid">
        <button className="like-btn" onClick={handleReaction}>
          <span className="count-label">
            {reactionCount === 0
              ? 'No likes yet'
              : reactionCount === 1
              ? '1 like'
              : `${reactionCount} likes`}
          </span>
        </button>
        <button className="comment-btn" onClick={handleCommentClick}>
          <span
            className="count-label clickable"
            onClick={handleCommentCountClick} // Make the comment count clickable
          >
            {commentCount === 0
              ? ''
              : commentCount === 1
              ? '1 comment'
              : `${commentCount} comments`}
          </span>
        </button>
        <div className="grid-item top">
          {media_type === 'video/mp4' && (
            <span className="count-label">
              {view_count} {view_count === 1 ? 'View' : 'Views'}
            </span>
          )}
        </div>

        <div className="grid-item bottom">
          <button
            className={`like-btn ${reaction === 'like' ? 'react' : ''}`}
            onClick={handleReaction}
            disabled={isReacting} // only disable during reaction animation
          >
            👍 Like
          </button>
        </div>
        <div className="grid-item bottom">
          <button
            className="comment-btn"
            onClick={handleCommentClick}
          >
            💬 Comment
          </button>
        </div>
        <div className="grid-item bottom">
          <button className="share-btn" disabled>
            🔗 Share
          </button>
        </div>
      </div>

      {/* Modal for commenting */}
      <CommentModal
        isVisible={isCommenting}
        public_id={public_id}
        isLoggedIn={isLoggedIn}
        onCancel={() => setIsCommenting(false)}
      />

      {/* Conditionally render the comments section outside the grid */}
      {isCommentSectionVisible && (
        <div className="comments-section-wrapper">
          <PostComment public_id={public_id} />
        </div>
      )}
    </div>
  );
};

export default EngagementControls;
