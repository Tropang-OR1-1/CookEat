import React, { forwardRef } from 'react';
import { Link } from 'react-router-dom';
import { formatDate } from './../../utils/formatDate.js';  // Your date formatting function
import './styles/recipepost.css';

const RecipePost = forwardRef(({
  public_id,
  title,
  description,
  created_at,
  updated_at,
  view_count,
  prep_time,
  cook_time,
  servings,
  difficulty,
  steps = [],
  avg_rating,
  user_rating,
  ratings_total,
  author_picture,
  author_username,
  author_public_id,
  media = [],
  ingredients = []
}, ref) => {

  const profileImageUrl = author_picture
    ? `https://cookeat.cookeat.space/media/profile/${author_picture}`
    : null;

  // Link to author profile
  const profileLink = `/user/${author_public_id}`;

  return (
    <div className="recipe-post" ref={ref}>
      <h2>{title}</h2>
      <p>{description}</p>

      <div className="recipe-meta">
        <span>Prep Time: {prep_time || 'N/A'} mins</span>
        <span>Cook Time: {cook_time || 'N/A'} mins</span>
        <span>Servings: {servings || 'N/A'}</span>
        <span>Difficulty: {difficulty || 'N/A'}</span>
        <span>Views: {view_count || 0}</span>
        <span>Created: {created_at ? formatDate(created_at) : 'N/A'}</span>
        <span>Updated: {updated_at ? formatDate(updated_at) : 'N/A'}</span>
      </div>

      <div className="author-info">
        {profileImageUrl && (
          <img
            src={profileImageUrl}
            alt={`${author_username}'s profile`}
            className="author-picture"
          />
        )}
        <Link to={profileLink} className="author-username">
          {author_username || 'Unknown Author'}
        </Link>
      </div>

      <div className="media-section">
        {media && media.length > 0 ? (
          media.map((m, i) => {
            if (m.media_type?.startsWith('image')) {
              return (
                <img
                  key={i}
                  src={`https://cookeat.cookeat.space/media/posts/${m.media_filename}`}
                  alt={`media-${i}`}
                  className="recipe-media"
                />
              );
            } else if (m.media_type?.startsWith('video')) {
              return (
                <video
                  key={i}
                  controls
                  className="recipe-media"
                  src={`https://cookeat.cookeat.space/media/posts/${m.media_filename}`}
                />
              );
            }
            return null;
          })
        ) : (
          <p>No media available</p>
        )}
      </div>

      <div className="ingredients-section">
        <h3>Ingredients</h3>
        {ingredients && ingredients.length > 0 ? (
          <ul>
            {ingredients.map(({ quantity, unit, ingredient_id }, i) => (
              <li key={i}>
                {quantity} {unit} of ingredient #{ingredient_id}
              </li>
            ))}
          </ul>
        ) : (
          <p>No ingredients listed.</p>
        )}
      </div>

      <div className="steps-section">
        <h3>Steps</h3>
        {steps && steps.length > 0 ? (
          <ol>
            {steps.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        ) : (
          <p>No steps provided.</p>
        )}
      </div>

      <div className="ratings-section">
        <p>Average Rating: {avg_rating !== undefined ? avg_rating : 'N/A'}</p>
        <p>User Rating: {user_rating !== undefined ? user_rating : 'Not rated yet'}</p>
        <p>Total Ratings: {ratings_total || 0}</p>
      </div>
    </div>
  );
});

export default RecipePost;
