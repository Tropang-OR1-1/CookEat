// CommentSkeleton.jsx
import React from 'react';
import './styles/CommentSkeleton.css';

const CommentSkeleton = () => {
  return (
    <div className="comment-skeleton">
      <div className="avatar-skeleton skeleton"></div>
      <div className="body-skeleton">
        <div className="header-skeleton skeleton"></div>
        <div className="text-skeleton skeleton"></div>
      </div>
    </div>
  );
};

export default CommentSkeleton;
