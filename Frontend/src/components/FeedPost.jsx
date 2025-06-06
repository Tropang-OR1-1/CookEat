import React, { useState, forwardRef } from 'react';
import { formatDate } from '../utils/formatDate.js';
import './styles/feedpost.css'; // goods rin to
import FeedPostDropdown from './FeedPost/FeedPostDropdown.jsx'; // oks naman ah
import EngagementControls from './FeedPost/EngagementControls.jsx';
import CommentSection from './FeedPost/CommentSection.jsx';
import { Link } from 'react-router-dom';

const FeedPost = forwardRef(({
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
  session_username,
  session_user_picture,
  openLoginModal
}, ref) => {
  const [showComments, setShowComments] = useState(false);

  const profileImageUrl = `https://cookeat.cookeat.space/media/profile/${author_picture}`;
  const mediaUrl = media_filename ? `https://cookeat.cookeat.space/media/posts/${media_filename}` : null;
  const myPublicId = (localStorage.getItem('public_id') || '').trim();
  const profileLink = (author_public_id === myPublicId) ? '/profile' : `/user/${author_public_id}`;

  const handleProfileClick = (e) => {
    if (!isLoggedIn) {
      e.preventDefault();
      openLoginModal();
    }
  };

  const handleCommentCountClick = () => {
    if (!isLoggedIn) {
      openLoginModal();
      return;
    }
    setShowComments(prev => !prev);
  };

  const handleCommentButtonClick = () => {
    if (!isLoggedIn) {
      openLoginModal();
      return;
    }
    if (!showComments) setShowComments(true);
  };

  return (
    <div className="feed-post" ref={ref}>
      <div className="feed-post__profile-section">
        <Link
          to={profileLink}
          className="feed-post__profile-left"
          onClick={handleProfileClick}
        >
          <img src={profileImageUrl} alt="Profile" className="feed-post__profile-img" />
          <div className="feed-post__profile-info">
            <p className="feed-post__author-username">{author_username}</p>
            <p className="feed-post__time">{formatDate(created_at)}</p>
          </div>
        </Link>

        <FeedPostDropdown
          public_id={public_id}
          title={title}
          content={content}
          created_at={created_at}
          updated_at={updated_at}
          view_count={view_count}
          media_filename={media_filename}
          media_type={media_type}
          reactions_total={reactions_total}
          user_reacted={user_reacted}
          comment_count={comment_count}
          ref_public_id={ref_public_id}
          author_public_id={author_public_id}
          author_username={author_username}
          author_picture={author_picture}
        />
      </div>

      {title && (
        <div className="feed-post__title">
          <h3>{title}</h3>
        </div>
      )}

      {content && (
        <div className="feed-post__caption-wrapper">
          <p className="feed-post__caption">{content}</p>
        </div>
      )}

      <div className="feed-post__media-container">
        {media_type === 'image' && mediaUrl && <img src={mediaUrl} alt="Post Media" />}
        {media_type === 'video' && mediaUrl && (
          <video controls>
            <source src={mediaUrl} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        )}
      </div>

      <div className="feed-post__footer">
        <EngagementControls
          public_id={public_id}
          title={title}
          content={content}
          created_at={created_at}
          updated_at={updated_at}
          view_count={view_count}
          media_filename={media_filename}
          media_type={media_type}
          reactions_total={reactions_total}
          user_reacted={user_reacted}
          comment_count={comment_count}
          ref_public_id={ref_public_id}
          author_public_id={author_public_id}
          author_username={author_username}
          author_picture={author_picture}
          isLoggedIn={isLoggedIn}
          showComments={showComments}
          setShowComments={setShowComments}
          onCommentCountClick={handleCommentCountClick}
          onCommentButtonClick={handleCommentButtonClick}
          openLoginModal={openLoginModal}
        />

        {showComments && (
          <div className="feed-post__comments-wrapper">
            <CommentSection
              public_id={public_id}
              comment_count={comment_count}
              author_picture={author_picture}
              session_username={session_username}
              session_user_picture={session_user_picture}
              isVisible={showComments}
              onCancel={() => setShowComments(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
});

export default FeedPost;
