import React, { useState } from 'react';
import './CreatePost.css'; // Ensure you have the correct path to your CSS file

function CreatePost ({ isOpen, onClose }) {
  const [formData, setFormData] = useState({
    postTitle: '',
    caption: '',
    media: null,
    instructions: '',
    ingredients: ''
  });

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: files ? files[0] : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(formData);
    // Add form submission logic here
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
  
};

export default CreatePost;