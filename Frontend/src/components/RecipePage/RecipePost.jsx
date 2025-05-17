import React, { forwardRef } from 'react';
import { formatDate } from './../../utils/formatDate.js';
import './styles/recipepost.css';

import { Link } from 'react-router-dom';


const RecipePost = forwardRef(({
  public_id,
  title,
  content,
  created_at,
  updated_at,
  view_count,
  media_filename,
  media_type,
  reactions_total,
  user_reacted,
  comment_count,
  ref_public_id,
  author_public_id,
  author_username,
  author_picture
}, ref) => {
  const isLoggedIn = !!localStorage.getItem('token');
  const profileImageUrl = `https://cookeat.cookeat.space/media/profile/${author_picture}`;
  const mediaUrl = media_filename ? `https://cookeat.cookeat.space/media/posts/${media_filename}` : null;

  // Get logged-in user's public_id from localStorage (or wherever you store it)
  const myPublicId = (localStorage.getItem('public_id') || '').trim();
  console.log(myPublicId);
  // Determine link target
  const profileLink = (author_public_id === myPublicId) ? '/profile' : `/user/${author_public_id}`;
  
  return (
    <div>
      
    </div>
  );
});

export default RecipePost;
