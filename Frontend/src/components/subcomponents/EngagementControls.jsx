import React, { useState } from 'react';
import axios from 'axios';
import CommentModal from './CommentModal';
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

  return (
    <div className="engagement-controls-grid">
      <div className="grid-item top">
        <span className="count-label">
          {reactionCount === 0
            ? 'No likes yet'
            : reactionCount === 1
            ? '1 like'
            : `${reactionCount} likes`}
        </span>
      </div>
      <div className="grid-item top">
        <span className="count-label">
          {comment_count === 0
            ? ''
            : comment_count === 1
            ? '1 comment'
            : `${comment_count} comments`}
        </span>
      </div>
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
          disabled={!isLoggedIn || isReacting}
        >
          👍 Like
        </button>
      </div>
      <div className="grid-item bottom">
        <button
          className="comment-btn"
          onClick={handleCommentClick}
          disabled={!isLoggedIn}
        >
          💬 Comment
        </button>
      </div>
      <div className="grid-item bottom">
        <button className="share-btn" disabled>
          🔗 Share
        </button>
      </div>

      <CommentModal
        isVisible={isCommenting}
        post_id={public_id}
        isLoggedIn={isLoggedIn}
        onCancel={() => setIsCommenting(false)}
      />
    </div>
  );
};

export default EngagementControls;