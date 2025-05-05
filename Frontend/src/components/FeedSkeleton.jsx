import React from 'react';
import './styles/feedskeleton.css';

function FeedSkeleton() {
  return (
    <div className="feed-post skeleton">
      <div className="profile-section">
        <div className="profile-left">
          <div className="skeleton-circle profile-img" />
          <div className="profile-info">
            <div className="skeleton-line short" />
            <div className="skeleton-line tiny" />
          </div>
        </div>
      </div>

      <div className="post-caption">
        <div className="skeleton-line long" />
      </div>

      <div className="media-container">
        <div className="skeleton-box media" />
      </div>

      <div className="recipe-details">
        <div className="skeleton-line short" />
        <div className="skeleton-line short" />
        <div className="skeleton-line short" />
      </div>

      <div className="engagement">
        <div className="skeleton-line tiny" />
      </div>
    </div>
  );
}

export default FeedSkeleton;
