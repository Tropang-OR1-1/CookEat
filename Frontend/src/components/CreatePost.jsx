import { jwtDecode } from 'jwt-decode';
import React, { useState } from 'react';
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

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
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
      console.log("Decoded token:", decoded); 
  
      userId = decoded.payload;

      if (!userId || !isValidUUID(userId)) {
        alert("Invalid or missing user ID in the token.");
        return;
      }
  
      console.log("Valid user ID:", userId);
    } catch (err) {
      console.error("Token decode error:", err);
      alert("Invalid or corrupted login token. Please log in again.");
      return;
    }

    if (!formData.media) {
      alert("Please upload an image or video.");
      return;
    }

    const data = new FormData();
    data.append('title', formData.postTitle);
    data.append('description', formData.caption);
    data.append('media', formData.media);
    data.append('instructions', formData.instructions);
    data.append('ingredients', formData.ingredients);
    data.append('user_id', userId);

    console.log("Form Data: ", formData);

    try {
      const response = await axios.post(
        'https://cookeat.cookeat.space/posts/create',
        data,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
  
      alert("Post created successfully!");
      onClose();
    } catch (error) {
      console.error("Post creation failed:", error);
      if (error.response && error.response.data) {
        alert(`Error: ${error.response.data.error || JSON.stringify(error.response.data)}`);
      } else {
        alert("Failed to create post.");
      }
    }
  };
  
  const isValidUUID = (str) => {
    const regex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    return regex.test(str);
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

          <button type="submit" className="publish-btn">Publish Post</button>
        </form>
      </div>
    </div>
  );
}

export default CreatePost;
