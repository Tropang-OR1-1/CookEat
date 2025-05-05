import React, { useState, useEffect, useRef, useCallback } from 'react';
import FeedPost from './../components/FeedPost.jsx';
import FeedPostSkeleton from './../components/FeedPostSkeleton.jsx';

import './styles/feedpage.css';

function FeedPage() {
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const observer = useRef();

  const lastPostRef = useCallback(
    node => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver(
        entries => {
          if (entries[0].isIntersecting && hasMore) {
            setPage(prev => prev + 1);
          }
        },
        {
          threshold: 0.5, // has to view 50% of the ano yung pagination then new post will load
        }
      );

      if (node) observer.current.observe(node);
    },
    [loading, hasMore]
  );

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`https://cookeat.cookeat.space/query/feed/posts?page=${page}`);
        if (!response.ok) throw new Error('Failed to fetch posts');

        const data = await response.json();
        if (data && Array.isArray(data.posts)) {
          setPosts(prev => [...prev, ...data.posts]);
          if (data.posts.length < 10) setHasMore(false); // No more pages
        } else {
          setHasMore(false);
          setError('Invalid data format or no posts');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [page]);

  return (
    <div className="feed-page-container">
      <div className="feed-posts">
        {posts.map((post, index) => {
          const isLast = index === posts.length - 1;
          return (
            <FeedPost
              key={post.public_id}
              profileImage={`path/to/profile/${post.author.picture}`}
              username={post.author.username}
              time={new Date(post.created_at).toLocaleString()}
              caption={post.title}
              mediaType={post.media[0]?.media_type}
              mediaSrc={`path/to/media/${post.media[0]?.media_filename}`}
              reactionsCount={post.reactions_count}
              postId={post.public_id}
              initialLikes={post.reactions_count}
              initialComments={post.comments_count || 0}
              ref={isLast ? lastPostRef : null}
            />
          );
        })}
        {loading && [...Array(3)].map((_, i) => <FeedPostSkeleton key={`skeleton-${i}`} />)}
        {error && <p>Error: {error}</p>}
        {!hasMore && <p>No more posts to show.</p>}
      </div>
    </div>
  );
}

export default FeedPage;
