import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import PostComment from './PostComment';
import CommentItem from './CommentItem';
import CommentSkeleton from './CommentSkeleton';
import './styles/CommentSection.css';

const CommentSection = ({ public_id, isVisible, isLoggedIn }) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isCommenting, setIsCommenting] = useState(false);
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

  // Infinite scroll handler
  const handleScroll = () => {
    if (!containerRef.current || loading) return;

    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    if (scrollHeight - scrollTop <= clientHeight + 100) { // 100px from bottom
      if (page < totalPages) {
        setPage((prev) => prev + 1);
      }
    }
  };

  useEffect(() => {
    if (page > 1) {
      fetchComments(page);
    }
  }, [page, fetchComments]);

  if (!isVisible) return null;

  return (
    <div className="comment-section">
      <div className="comment-section__header">
        <h3>Comments</h3>
      </div>

      <div
        className="comment-section__list"
        ref={containerRef}
        onScroll={handleScroll}
      >
        {comments.length === 0 && !loading && !error && (
          <p>No comments yet.</p>
        )}

        {comments.map((comment) => (
          <CommentItem key={comment.comment_id} comment={comment} />
        ))}

        {loading &&
          Array.from({ length: 3 }).map((_, i) => (
            <CommentSkeleton key={i} />
          ))}

        {error && <p className="comment-section__error">{error}</p>}
      </div>

      <button
        className="comment-section__write-button"
        onClick={() => setIsCommenting(true)}
      >
        Write a comment
      </button>

      <PostComment
        isVisible={isCommenting}
        public_id={public_id}
        isLoggedIn={isLoggedIn}
        onCancel={() => setIsCommenting(false)}
        onPostSuccess={() => {
          setIsCommenting(false);
          setPage(1);
          fetchComments(1);
        }}
      />
    </div>
  );
};

export default CommentSection;
