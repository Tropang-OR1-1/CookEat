import React, { forwardRef } from 'react';
import { formatDate } from '../utils/formatDate.js';
import './styles/feedpost.css';
import FeedPostDropdown from './subcomponents/FeedPostDropdown.jsx';
import EngagementControls from './subcomponents/EngagementControls.jsx';
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
  author_picture
}, ref) => {
  const isLoggedIn = !!localStorage.getItem('token');
  const profileImageUrl = `https://cookeat.cookeat.space/media/profile/${author_picture}`;
  const mediaUrl = media_filename ? `https://cookeat.cookeat.space/media/posts/${media_filename}` : null;

  // Get logged-in user's public_id from localStorage (or wherever you store it)
  const myPublicId = (localStorage.getItem('public_id') || '').trim();

  // Determine link target
  const profileLink = (author_public_id === myPublicId) ? '/profile' : `/user/${author_public_id}`;
  
  return (
    <div className="feed-post" ref={ref}>
      {/* Profile Section */}
      <div className="feed-post__profile-section">
        <Link to={profileLink} className="feed-post__profile-left">
          <img src={profileImageUrl} alt="Profile" className="feed-post__profile-img" />
          <div className="feed-post__profile-info">
            <p className="feed-post__author-username">{author_username}</p>
            <p className="feed-post__time">{formatDate(created_at)}</p>
          </div>
        </Link>

        {/* Dropdown Component */}
        <FeedPostDropdown postId={public_id} />
      </div>

      {/* Title */}
      {title && (
        <div className="feed-post__title">
          <h3>{title}</h3>
        </div>
      )}

      {/* Caption / Content */}
      {content && (
        <div className="feed-post__caption-wrapper">
          <p className="feed-post__caption">{content}</p>
        </div>
      )}

      {/* Media */}
      <div className="feed-post__media-container">
        {media_type === 'image' && mediaUrl && <img src={mediaUrl} alt="Post Media" />}
        {media_type === 'video' && mediaUrl && (
          <video controls>
            <source src={mediaUrl} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        )}
      </div>

      {/* Engagement Section */}
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
      />
    </div>
  );
});

export default FeedPost;
