import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import PostComment from './PostComment';
import CommentItem from './CommentItem';
import CommentSkeleton from './CommentSkeleton';
import './styles/CommentSection.css';

const CommentSection = ({
  public_id,
  comment_count,
  isVisible,
  isLoggedIn,
  session_username,
  session_user_picture,
}) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const containerRef = useRef(null);

  const fetchComments = useCallback(async (pageNum) => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const url = `https://cookeat.cookeat.space/comments/${public_id}?page=${pageNum}&limit=10`;
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const { data, totalPages } = response.data;
      setComments((prev) => (pageNum === 1 ? data : [...prev, ...data]));
      setTotalPages(totalPages);
    } catch (error) {
      setError('Error fetching comments');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [public_id]);

  useEffect(() => {
    if (isVisible) {
      setPage(1);
      fetchComments(1);
    }
  }, [fetchComments, isVisible]);

  useEffect(() => {
    if (page > 1) {
      fetchComments(page);
    }
  }, [page, fetchComments]);

  if (!isVisible) return null;

  const commentSkeletonCount = comment_count > 5 ? 5 : comment_count;

  return (
    <div className="comment-section">
      <div className="comment-section__header">
        <h3>Comments</h3>
      </div>

      <PostComment
        public_id={public_id}
        session_username={session_username}
        session_user_picture={session_user_picture}
        onPostSuccess={() => {
          setPage(1);
          fetchComments(1);
        }}
      />

      <div
        className="comment-section__list"
        ref={containerRef}
      >

        {comments.map((comment) => (
          <CommentItem key={comment.comment_id} comment={comment} />
        ))}

        {loading &&
          Array.from({ length: commentSkeletonCount }).map((_, i) => (
            <CommentSkeleton key={i} />
          ))}

        {error && <p className="comment-section__error">{error}</p>}
      </div>
    </div>
  );
};

export default CommentSection;
