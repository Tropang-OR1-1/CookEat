import React, { useState } from 'react';
import { formatDate } from './../../utils/formatDate';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import './styles/CommentItem.css';

const CommentItem = ({ comment, onDelete }) => {
  const loggedInPublicId = localStorage.getItem('public_id');
  const token = localStorage.getItem('token'); // or wherever your token is stored
  const isCommentAuthor = loggedInPublicId === comment.user_public_id;

  const [showOptions, setShowOptions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.comment_text);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [localCommentText, setLocalCommentText] = useState(comment.comment_text); // local updated comment text

  const handleEdit = () => {
    setIsEditing(true);
    setShowOptions(false);
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
    setShowOptions(false);
  };

  const confirmDelete = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`https://cookeat.cookeat.space/comments/${comment.comment_id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete comment');
      }

      // Call the parent callback to remove the comment from UI
      onDelete(comment.comment_id);
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error(error);
      alert('Failed to delete comment. Please try again.');
    }
  };


  const handleUpdateComment = async () => {
    if (!editText.trim()) return;

    try {
      const formData = new FormData();
      formData.append('content', editText);

      const response = await fetch(`https://cookeat.cookeat.space/comments/${comment.comment_id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`, // only auth header, **do NOT** set Content-Type manually for FormData
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to update comment');
      }

      const updatedComment = await response.json();
      setLocalCommentText(updatedComment.comments);
      setIsEditing(false);
    } catch (error) {
      console.error(error);
      alert('Failed to update comment. Please try again.');
    }
  };

  return (
    <>
      <li className="comment-item">
        <img
          src={`https://cookeat.cookeat.space/media/profile/${comment.user_picture || 'default_profile.png'}`}
          alt="User"
          className="comment-avatar"
        />
        <div className="comment-content">
          <div className="comment-header">
            <strong className="comment-user">{comment.user_name}</strong>
          </div>

          {isEditing ? (
            <div className="comment-edit-box">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="comment-edit-input"
              />
              <div className="comment-edit-actions">
                <button onClick={handleUpdateComment}>Save</button>
                <button onClick={() => setIsEditing(false)}>Cancel</button>
              </div>
            </div>
          ) : (
            <div className="comment-actions-container">
              <p className="comment-text">{localCommentText}</p>

              {isCommentAuthor && (
                <div className="comment-options">
                  <MoreHorizIcon
                    onClick={() => setShowOptions(!showOptions)}
                    className="comment-options-icon"
                  />
                  {showOptions && (
                    <ul className="comment-dropdown">
                      <li onClick={handleEdit}>Edit</li>
                      <li onClick={handleDelete}>Delete</li>
                    </ul>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="comment-footer">
            <span className="comment-time">
              {formatDate(comment.comment_created_at)}
            </span>
            <button className="comment-action" type="button">Like</button>
            <button className="comment-action" type="button">Reply</button>
          </div>
        </div>
      </li>

      {showDeleteConfirm && (
        <div className="modal-overlay">
          <div className="modal">
            <p>Are you sure you want to delete this comment?</p>
            <button onClick={confirmDelete}>Yes, Delete</button>
            <button onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
          </div>
        </div>
      )}
    </>
  );
};

export default CommentItem;
