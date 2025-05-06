import { jwtDecode } from 'jwt-decode';
import React, { useState, useRef } from 'react';
import axios from 'axios';
import './styles/createrecipe.css';

function CreateRecipe({ isOpen, onClose }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    ingredients: [{ name: '', quantity: '', unit: '' }],
    steps: [''],
    category: '',
    prep_time: '',
    cook_time: '',
    servings: '',
    difficulty: '',
    thumbnail: null,
    media: null
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const thumbnailRef = useRef();
  const mediaRef = useRef();

  const difficulties = ['easy', 'medium', 'hard'];

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: files?.[0] ?? value,
    }));
  };

  const handleArrayChange = (index, name, field, value) => {
    setFormData((prev) => {
      const updated = [...prev[name]];
      if (name === 'steps') {
        updated[index] = value;
      } else {
        updated[index] = { ...updated[index], [field]: value };
      }
      return { ...prev, [name]: updated };
    });
  };

  const addField = (name) => {
    const newField = name === 'ingredients' ? { name: '', quantity: '', unit: '' } : '';
    setFormData((prev) => ({
      ...prev,
      [name]: [...prev[name], newField],
    }));
  };

  const removeField = (name, index) => {
    setFormData((prev) => {
      const updated = [...prev[name]];
      updated.splice(index, 1);
      return { ...prev, [name]: updated };
    });
  };

  const isValidUUID = (str) => {
    const regex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    return regex.test(str);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    const token = localStorage.getItem('token');
    if (!token) {
      alert("Please log in before creating a recipe.");
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
  
    const {
      title,
      description,
      ingredients,
      steps,
      category,
      prep_time,
      cook_time,
      servings,
      difficulty,
      thumbnail,
      media
    } = formData;
  
    if (!title || !description || ingredients.length === 0 || steps.length === 0) {
      alert("Please fill in all required fields: title, description, ingredients, and steps.");
      return;
    }
  
    const validIngredients = ingredients.filter(
      (ingredient) =>
        ingredient.name?.trim() !== '' &&
        ingredient.quantity?.trim() !== ''
    );
  
    if (validIngredients.length === 0) {
      alert("Please ensure all ingredients have valid names and quantities.");
      return;
    }
  
    const validSteps = steps.filter((step) => step?.trim() !== '');
    if (validSteps.length === 0) {
      alert("Please ensure all steps are valid.");
      return;
    }
  
    const data = new FormData();
    data.append('title', title);
    data.append('description', description);
    data.append('ingredients', JSON.stringify(validIngredients));
    data.append('steps', JSON.stringify(validSteps));
  
    // Optional fields – added safely
    if (category && typeof category === 'string' && category.trim() !== '') {
      data.append('category', category.trim());
    }
  
    if (prep_time && !isNaN(prep_time)) {
      data.append('prep_time', parseInt(prep_time, 10));
    }
  
    if (cook_time && !isNaN(cook_time)) {
      data.append('cook_time', parseInt(cook_time, 10));
    }
  
    if (servings && !isNaN(servings)) {
      data.append('servings', parseInt(servings, 10));
    }
  
    if (difficulties.includes(difficulty)) {
        data.append('difficulty', difficulty);
      }
      
  
    if (thumbnail) data.append('thumbnail', thumbnail);
    if (media) data.append('media', media);
  
    data.append('user_id', userId);
  
    try {
      setIsSubmitting(true);
      console.log("Form data being sent:", formData);
  
      const response = await axios.post(
        'https://cookeat.cookeat.space/recipe/',
        data,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
  
      console.log("Recipe created successfully:", response);
      alert("Recipe created successfully!");
      onClose();
  
      setFormData({
        title: '',
        description: '',
        ingredients: [{ name: '', quantity: '', unit: '' }],
        steps: [''],
        category: '',
        prep_time: '',
        cook_time: '',
        servings: '',
        difficulty: '',
        thumbnail: null,
        media: null,
      });
  
      if (thumbnailRef.current) thumbnailRef.current.value = null;
      if (mediaRef.current) mediaRef.current.value = null;
  
    } catch (error) {
      console.error("Recipe creation failed:", error.response ? error.response.data : error.message);
      alert("Failed to create recipe. Please check the form and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  

  if (!isOpen) return null;

  return (
    <div className="create-post-modal" onClick={(e) => e.currentTarget === e.target && onClose()}>
      <div className="modal-content">
        <button className="close-btn" onClick={onClose}>&times;</button>
        <h2>Create New Recipe</h2>
        <form onSubmit={handleSubmit} className="form">
          <label>Title:</label>
          <input type="text" name="title" value={formData.title} onChange={handleChange} maxLength="20" required />

          <label>Description:</label>
          <textarea name="description" value={formData.description} onChange={handleChange} required />

          {formData.ingredients.map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: '5px' }}>
              <input
                type="text"
                placeholder="Name"
                value={item.name || ''}
                onChange={(e) => handleArrayChange(i, 'ingredients', 'name', e.target.value)}
                required
              />
              <input
                type="text"
                placeholder="Quantity"
                value={item.quantity || ''}
                onChange={(e) => handleArrayChange(i, 'ingredients', 'quantity', e.target.value)}
                required
              />
              <input
                type="text"
                placeholder="Unit"
                value={item.unit || ''}
                onChange={(e) => handleArrayChange(i, 'ingredients', 'unit', e.target.value)}
                required
              />
              {formData.ingredients.length > 1 && (
                <button type="button" onClick={() => removeField('ingredients', i)}>-</button>
              )}
            </div>
          ))}

          <button type="button" onClick={() => addField('ingredients')}>Add Ingredient</button>

          <label>Steps:</label>
          {formData.steps.map((item, i) => (
            <div key={i}>
              <input
                type="text"
                value={item}
                onChange={(e) => handleArrayChange(i, 'steps', null, e.target.value)}
                required
              />
              {formData.steps.length > 1 && (
                <button type="button" onClick={() => removeField('steps', i)}>-</button>
              )}
            </div>
          ))}

          <button type="button" onClick={() => addField('steps')}>Add Step</button>

          <button
            type="button"
            onClick={() => setShowAdvanced((prev) => !prev)}
            style={{ marginTop: '10px', marginBottom: '10px' }}
          >
            {showAdvanced ? 'Hide Optional Fields ▲' : 'Show Optional Fields ▼'}
          </button>

          {showAdvanced && (
            <>
              <label>Category:</label>
              <input type="text" name="category" value={formData.category} onChange={handleChange} />

              <label>Prep Time (minutes):</label>
              <input type="number" name="prep_time" value={formData.prep_time} onChange={handleChange} />

              <label>Cook Time (minutes):</label>
              <input type="number" name="cook_time" value={formData.cook_time} onChange={handleChange} />

              <label>Servings:</label>
              <input type="number" name="servings" value={formData.servings} onChange={handleChange} />

              <label>Difficulty:</label>
              <select name="difficulty" value={formData.difficulty} onChange={handleChange}>
                <option value="">Select Difficulty</option>
                {difficulties.map((level) => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>

              <label>Thumbnail (image only):</label>
              <input type="file" name="thumbnail" accept="image/*" onChange={handleChange} ref={thumbnailRef} />

              <label>Media (image/video):</label>
              <input type="file" name="media" accept="image/*,video/*" onChange={handleChange} ref={mediaRef} />
            </>
          )}

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Publishing...' : 'Publish Recipe'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default CreateRecipe;
