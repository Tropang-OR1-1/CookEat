// DeletePost.jsx
import React, { useState } from 'react';
import './styles/DeletePost.css';

const DeletePost = ({ isOpen, onCancel, public_id }) => {
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleDelete = async () => {
    setLoading(true);
    try {
      const res = await fetch(`https://cookeat.cookeat.space/posts/${public_id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await res.json();

      if (res.ok) {
        setLoading(false);
        onCancel();  // close modal
        window.location.reload(); // reload page after deletion
      } else {
        setLoading(false);
        alert(data.error || 'Failed to delete post.');
      }
    } catch (err) {
      setLoading(false);
      console.error(err);
      alert('Server error.');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-box">
          <h3>Delete this post?</h3>
          <p>This action cannot be undone.</p>
          <div className="modal-actions">
            <button className="btn cancel" onClick={onCancel} disabled={loading}>Cancel</button>
            <button className="btn delete" onClick={handleDelete} disabled={loading}>
              {loading ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeletePost;
