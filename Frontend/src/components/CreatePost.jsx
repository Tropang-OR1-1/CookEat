import { jwtDecode } from 'jwt-decode';
import React, { useState, useRef } from 'react';
import axios from 'axios';
import './styles/createpost.css';

function CreatePost({
  avatar,
  username,
  isOpen,
  onClose
 }) {
  const [formData, setFormData] = useState({
    postTitle: '',
    content: '',
    media: null
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef();

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: files?.[0] ?? value,
    }));
  };

  const handleFocus = (e) => {
    if (e.target.value === e.target.defaultValue) {
      e.target.value = '';
    }
  };

  const handleBlur = (e) => {
    if (e.target.value === '') {
      e.target.value = e.target.defaultValue;
    }
  };

  const isValidUUID = (str) => {
    const regex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    return regex.test(str);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem('token');
    if (!token) {
      alert("Please log in before creating a post.");
      return;
    }

    let userId;
    try {
      const decoded = jwtDecode(token);
      userId = decoded.payload;

      if (!userId || !isValidUUID(userId)) {
        alert("Invalid or missing user ID in the token.");
        return;
      }
    } catch (err) {
      console.error("Token decode error:", err);
      alert("Invalid or corrupted login token. Please log in again.");
      return;
    }

    if (!formData.media) {
      alert("Please upload an image or video.");
      return;
    }

    if (formData.media.size > 50 * 1024 * 1024) {
      alert("Media file too large. Max size is 50MB.");
      return;
    }

    const data = new FormData();
    data.append('title', formData.postTitle);
    data.append('content', formData.content);
    data.append('media', formData.media);
    data.append('user_id', userId);

    try {
      setIsSubmitting(true);

      const response = await axios.post(
        'https://cookeat.cookeat.space/posts/',
        data,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("Post created successfully, response:", response);
      alert("Post created successfully!");

      // Reset form and close modal
      onClose();
      setFormData({
        postTitle: '',
        content: '',
        media: null
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = null;
      }
    } catch (error) {
      console.error("Post creation failed:", error);
      alert("Failed to create post.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="create-post-modal"
      onClick={(e) => {
        if (e.currentTarget === e.target) {
          onClose();
        }
      }}
    >
      <div className="modal-content">
        <button className="close-btn" onClick={onClose}>&times;</button>
        <h2>Create New Post</h2>
        <form onSubmit={handleSubmit} className="form">
          <div className="user-info">
            <img src={avatar} alt="User Icon" className="user-icon" />
            <span className="user-name">{username}</span>
          </div>

          <label htmlFor="postTitle">Post Title:</label>
          <input
            type="text"
            id="postTitle"
            name="postTitle"
            value={formData.postTitle || 'Be Cravetive'}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            required
            className="input-field"
          />

          <label htmlFor="content">Caption:</label>
          <textarea
            id="content"
            name="content"
            value={formData.content || 'What’s on your mind?'}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            className="input-field"
          />

          <label htmlFor="media">Upload Media (Picture/Video):</label>
          <input
            type="file"
            id="media"
            name="media"
            accept="image/*,video/*"
            onChange={handleChange}
            ref={fileInputRef}
            className="input-field"
          />

          <button
            type="submit"
            className="publish-btn"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Publishing...' : 'Publish Post'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default CreatePost;
