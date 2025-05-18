import React, { forwardRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { formatDate } from '../utils/formatDate.js';
import './styles/feedpost.css';
import FeedPostDropdown from './subcomponents/FeedPostDropdown.jsx';

const REACTIONS = {
  LIKE: 'UP',
  UNLIKE: 'NEUTRAL',
};

const FeedPost = forwardRef(({
  public_id,
  title,
  content,
  created_at,
  updated_at,
  media_filename,
  media_type,
  reactions_total,
  user_reacted,
  comment_count: initialCommentCount,
  ref_public_id,
  author_public_id,
  author_username,
  author_picture,
  view_count,

}, ref) => {
  const [likes, setLikes] = useState(reactions_total || 0);
  const [comments, setComments] = useState(initialCommentCount || 0);
  const [reaction, setReaction] = useState(user_reacted ? 'like' : null);
  const [isReacting, setIsReacting] = useState(false);
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [newComment, setNewComment] = useState('');
  const isLoggedIn = !!localStorage.getItem('token');
  const myPublicId = (localStorage.getItem('public_id') || '').trim();
  const [views, setViews] = useState(view_count || 0);


  const profileImageUrl = `https://cookeat.cookeat.space/media/profile/${author_picture}`;
  const mediaUrl = media_filename ? `https://cookeat.cookeat.space/media/posts/${media_filename}` : null;
  const profileLink = (author_public_id === myPublicId) ? '/profile' : `/user/${author_public_id}`;

  useEffect(() => {
  // Optionally simulate increasing view count
  setViews((prev) => prev + 1);
}, []);


  useEffect(() => {
  console.log(`FeedPost mounted: ${public_id}`);

  // Optional: cleanup logic
  return () => {
    console.log(`FeedPost unmounted: ${public_id}`);
  };
}, [public_id]);


  const handleReaction = async () => {
    if (!isLoggedIn) return alert('Please log in to react to this post!');
    if (isReacting) return;

    const token = localStorage.getItem('token');
    const newReaction = reaction === 'like' ? REACTIONS.UNLIKE : REACTIONS.LIKE;
    setIsReacting(true);

    try {
      const response = await axios.post(`https://cookeat.cookeat.space/react/post`, [newReaction], {
        params: { post_id: public_id },
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 200) {
        if (newReaction === REACTIONS.LIKE) {
          setReaction('like');
          setLikes((prev) => prev + 1);
        } else {
          setReaction(null);
          setLikes((prev) => Math.max(0, prev - 1));
        }
      }
    } catch (err) {
      console.error('Reaction error:', err);
    } finally {
      setIsReacting(false);
    }
  };

  const handleCommentClick = () => {
    if (!isLoggedIn) return alert('Please log in to comment!');
    setCommentModalOpen(true);
  };

  const handleCommentSubmit = async () => {
    if (!newComment.trim()) return alert('Enter a comment!');
    const token = localStorage.getItem('token');

    try {
      const response = await axios.post('https://cookeat.cookeat.space/feed/comments', {
        post_id: public_id,
        comment: newComment,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 200) {
        setComments((prev) => prev + 1);
        setNewComment('');
        setCommentModalOpen(false);
      }
    } catch (err) {
      console.error('Error commenting:', err);
    }
  };

  return (
    <div className="feed-post" ref={ref}>
      {/* Profile */}
      <div className="feed-post__profile-section">
        <Link to={profileLink} className="feed-post__profile-left">
          <img src={profileImageUrl} alt="Profile" className="feed-post__profile-img" />
          <div className="feed-post__profile-info">
            <p className="feed-post__author-username">{author_username}</p>
            <p className="feed-post__time">{formatDate(created_at)}</p>
          </div>
        </Link>
        <FeedPostDropdown postId={public_id} />
      </div>

      {/* Title */}
      {title && (
        <div className="feed-post__title">
          <h3>{title}</h3>
        </div>
      )}

      {/* Content */}
      {content && (
        <div className="feed-post__caption-wrapper">
          <p className="feed-post__caption">{content}</p>
        </div>
      )}

      {/* Media */}
      <div className="feed-post__media-container">
        {media_type === 'image' && mediaUrl && <img src={mediaUrl} alt="Post Media" />}
        {media_type === 'video' && mediaUrl && (
          <video controls>
            <source src={mediaUrl} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        )}
      </div>

      {/* Engagement Section */}
<div className="feed-post__engagement-section">
  <div className="engagement-button-group">
    <button
      className={`engagement-btn like ${reaction === 'like' ? 'reacted' : ''}`}
      onClick={handleReaction}
      disabled={!isLoggedIn || isReacting}
    >
      👍 {likes}
    </button>
    <button
      className="engagement-btn comment"
      onClick={handleCommentClick}
      disabled={!isLoggedIn}
    >
      💬 {comments}
    </button>
    <button className="engagement-btn share">
      🔗 Share
    </button>
  </div>

  {/* 👁️ View Count */}
  <div className="engagement-metrics mt-1 text-sm text-gray-500">
    👁️ {view_count} views
  </div>
</div>


      {/* Comment Modal */}
      {commentModalOpen && (
        <div className="comment-modal">
          <div className="modal-content">
            <h3>Post a Comment</h3>
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write your comment..."
            />
            <div className="modal-actions">
              <button onClick={handleCommentSubmit}>Submit</button>
              <button onClick={() => setCommentModalOpen(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default FeedPost;
