import React, { useState } from 'react';
import axios from 'axios';
import './styles/commentmodal.css';

const CommentModal = ({public_id, isVisible, isLoggedIn, onCancel }) => {
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isVisible) return null;

  const handleSubmit = async () => {
    if (!isLoggedIn) {
      alert('Please log in to comment on this post!');
      return;
    }

    if (!newComment.trim()) {
      alert('Please enter a comment!');
      return;
    }

    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('content', newComment); // ✅ Correct key

      const response = await axios.post(
        `https://cookeat.cookeat.space/comments/${public_id}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 200) {
        setNewComment('');
        onCancel(); // close modal
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="comment-modal">
      <div className="modal-content">
        <h3>Post a Comment</h3>
        <textarea
          className="comment-textarea"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Write your comment..."
        />
        <div className="modal-actions">
          <button className="modal-button submit" onClick={handleSubmit} disabled={isSubmitting}>
            Submit
          </button>
          <button className="modal-button cancel" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default CommentModal;
