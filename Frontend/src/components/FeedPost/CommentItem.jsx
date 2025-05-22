import React from 'react';
import { formatDate } from './../../utils/formatDate';
import './styles/CommentItem.css';

const CommentItem = ({ comment }) => {
  return (
    <li className="comment-item">
      <img
        src={`https://cookeat.cookeat.space/media/profile/${comment.user_picture || 'default.png'}`}
        alt="User"
        className="comment-avatar"
      />
      <div className="comment-content">
        <div className="comment-header">
          <strong className="comment-user">{comment.user_name}</strong>
        </div>

        <p className="comment-text">{comment.comment_text}</p>

        <div className="comment-footer">
          <span className="comment-time">
            {formatDate(comment.comment_created_at)}
          </span>
          <button className="comment-action" type="button">Like</button>
          <button className="comment-action" type="button">Reply</button>
        </div>
      </div>
    </li>
  );
};

export default CommentItem;
