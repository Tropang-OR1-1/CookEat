import { jwtDecode } from 'jwt-decode';
import React, { useState, useRef } from 'react';
import axios from 'axios';
import './styles/createpost.css';

function CreatePost({ isOpen, onClose }) {
  const [formData, setFormData] = useState({
    postTitle: '',
    caption: '',
    media: null,
    instructions: '',
    ingredients: '',
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

    if (formData.media.size > 5 * 1024 * 1024) {
      alert("Media file too large. Max size is 5MB.");
      return;
    }

    const data = new FormData();
    data.append('title', formData.postTitle);
    data.append('description', formData.caption);
    data.append('media', formData.media);
    data.append('instructions', formData.instructions);
    data.append('ingredients', formData.ingredients);
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
        caption: '',
        media: null,
        instructions: '',
        ingredients: '',
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
          <label htmlFor="postTitle">Post Title:</label>
          <input
            type="text"
            id="postTitle"
            name="postTitle"
            value={formData.postTitle}
            onChange={handleChange}
            required
            className="input-field"
          />

          <label htmlFor="caption">Caption:</label>
          <textarea
            id="caption"
            name="caption"
            value={formData.caption}
            onChange={handleChange}
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

          <label htmlFor="instructions">Instructions (How to Cook):</label>
          <textarea
            id="instructions"
            name="instructions"
            value={formData.instructions}
            onChange={handleChange}
            required
            className="input-field"
          />

          <label htmlFor="ingredients">Ingredients:</label>
          <textarea
            id="ingredients"
            name="ingredients"
            value={formData.ingredients}
            onChange={handleChange}
            required
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
