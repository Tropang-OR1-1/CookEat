import React from 'react';
import './styles/postskeleton.css';

const PostSkeleton = () => {
  return (
    <div className="feed-post-skeleton">
      <div className="profile-section">
        <div className="skeleton-box profile-img"></div>
        <div className="profile-info">
          <div className="skeleton-box"></div>
          <div className="skeleton-box"></div>
        </div>
      </div>

      <div className="post-caption">
        <div className="skeleton-box"></div>
        <div className="skeleton-box"></div>
      </div>

      <div className="media-container">
        <div className="skeleton-box media"></div>
      </div>

      <div className="recipe-details">
        <div className="skeleton-box"></div>
        <div className="skeleton-box"></div>
        <div className="skeleton-box"></div>
      </div>

      <div className="engagement">
        <div className="skeleton-box button"></div>
        <div className="skeleton-box button"></div>
        <div className="skeleton-box button"></div>
      </div>
    </div>
  );
};

export default PostSkeleton;
