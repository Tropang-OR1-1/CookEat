import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './styles/PostComment.css';
import LoginRegister from './../LoginRegister';

const PostComment = ({
  public_id,
  onPostSuccess,
  session_username,
}) => {
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  const isLoggedIn = !!localStorage.getItem('token');
  const inputRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isLoggedIn) {
      setShowLogin(true);
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
      formData.append('content', newComment);

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
        if (onPostSuccess) onPostSuccess();
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
      alert('Failed to submit comment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });

      setTimeout(() => {
        inputRef.current.focus({ preventScroll: true });
      }, 300);
    }
  }, []);

  return (
    <div className="post-comment-container">
      {!isLoggedIn && showLogin && <LoginRegister onClose={() => setShowLogin(false)} />}
      <form className="post-comment-form" onSubmit={handleSubmit}>
        <img src={localStorage.getItem("avatar")} alt="User" className="comment-avatar" />
        <input
          ref={inputRef}
          type="text"
          className="comment-input"
          placeholder={`Comment as ${session_username}`}
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
        />
        <button type="submit" disabled={isSubmitting} className="comment-submit-button">
          Post
        </button>
      </form>
    </div>
  );
};

export default PostComment;
