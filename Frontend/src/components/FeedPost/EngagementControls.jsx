import React, { useState } from 'react';
import axios from 'axios';
import PostReaction from './PostReaction';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ShareIcon from '@mui/icons-material/Share';

import './styles/EngagementControl.css';

const EngagementControls = ({
  public_id,
  isLoggedIn,
  setShowComments,
  comment_count,
  reactions_total,
  user_reacted,
  media_type,
  view_count,
  openLoginModal
}) => {
  const [reaction, setReaction] = useState(user_reacted === 'UP' ? 'like' : null);
  const [reactionCount, setReactionCount] = useState(reactions_total);
  const [isReacting, setIsReacting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const totalComments = Number(comment_count ?? 0);

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

  const handleReactCountClick = () => {
    if (reactionCount > 0) {
      setIsModalOpen(true);
    }
  };

  const handleCommentCountClick = () => {
    if (totalComments > 0) {
      setShowComments((prev) => !prev);
    }
  };

  const handleCommentClick = () => {
    if (!isLoggedIn) {
      openLoginModal();
      return;
    }
    setShowComments((prev) => !prev);
  };

  return (
    <div className="engagement-controls-container">
      <div className="engagement-flex-wrapper">
        {/* Top Row: counts */}
        <div className="top-row">
          <div className="count-column" onClick={handleReactCountClick}>
            <span>
              {reactionCount > 0 ? `${reactionCount} like${reactionCount > 1 ? 's' : ''}` : ' '}
            </span>
          </div>

          <div className="count-column" onClick={handleCommentCountClick}>
            <span>
              {totalComments > 0 ? `${totalComments} comment${totalComments > 1 ? 's' : ''}` : ' '}
            </span>
          </div>

          <div className="count-column">
            {media_type === 'video' && (
              <span>
                <VisibilityIcon fontSize="small" style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                {view_count} {view_count === 1 ? 'View' : 'Views'}
              </span>
            )}
          </div>
        </div>

        {/* Bottom Row: buttons */}
        <div className="bottom-row">
          <button
            className={`action-btn ${reaction === 'like' ? 'react' : ''}`}
            onClick={handleReaction}
            disabled={isReacting}
          >
            <ThumbUpIcon fontSize="medium" />
            <span>Like</span>
          </button>

          <button
            className="action-btn"
            onClick={handleCommentClick}
          >
            <ChatBubbleOutlineIcon fontSize="medium" />
            <span>Comment</span>
          </button>

          <button className="action-btn" disabled>
            <ShareIcon fontSize="medium" />
            <span>Share</span>
          </button>
        </div>
      </div>

      {/* Post Reaction Modal */}
      <PostReaction
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        public_id={public_id}
        reactions_total={reactions_total}
      />
    </div>
  );
};

export default EngagementControls;
