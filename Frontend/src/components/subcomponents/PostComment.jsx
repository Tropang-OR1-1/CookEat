import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './styles/postcomment.css';

const PostComment = ({ public_id }) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch comments when the component is mounted or page changes
  useEffect(() => {
    const fetchComments = async () => {
      setLoading(true);
      setError(null);

      try {
        const token = localStorage.getItem('token'); // Get token if logged in
        const url = `https://cookeat.cookeat.space/comments/${public_id}?page=${page}&limit=10`; // Pass page and limit in query
        const response = await axios.get(url, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const { data, totalPages } = response.data;
        setComments(data); // Update comments state
        setTotalPages(totalPages); // Set total pages for pagination
      } catch (error) {
        setError('Error fetching comments');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchComments();
  }, [public_id, page]); // Re-run effect when `public_id` or `page` changes

  // Handle pagination (next page)
  const handleNextPage = () => {
    if (page < totalPages) {
      setPage(page + 1);
    }
  };

  // Handle pagination (previous page)
  const handlePrevPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  return (
    <div className="comments-section">
      <h3>Comments</h3>
      {loading ? (
        <p>Loading comments...</p>
      ) : error ? (
        <p>{error}</p>
      ) : comments.length > 0 ? (
        <ul>
          {comments.map((comment) => (
            <li key={comment.comment_id} className="comment-item">
              <p><strong>{comment.user_name}</strong></p>
              <p>{comment.comment_text}</p>
              <span>{new Date(comment.comment_created_at).toLocaleString()}</span>
              <div className="reactions">
                {/* Render reactions if needed */}
                <span>{comment.reactions?.total} reactions</span>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p>No comments yet.</p>
      )}

      {/* Pagination controls */}
      <div className="pagination-controls">
        <button onClick={handlePrevPage} disabled={page === 1}>
          Previous
        </button>
        <span>Page {page} of {totalPages}</span>
        <button onClick={handleNextPage} disabled={page === totalPages}>
          Next
        </button>
      </div>
    </div>
  );
};

export default PostComment;
