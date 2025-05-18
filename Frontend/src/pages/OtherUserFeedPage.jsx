import React, { useEffect, useRef, useCallback, useState } from 'react';
import FeedPost from './../components/FeedPost.jsx';
import FeedPostSkeleton from './../components/PostSkeleton.jsx';
import './styles/feedpage.css';

function OtherUserFeedPage({ public_id }) {
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [scrollY, setScrollY] = useState(0);

  const observer = useRef();

  const lastPostRef = useCallback(
    (node) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMore) {
            setPage((prevPage) => prevPage + 1);
          }
        },
        { threshold: 0.5 }
      );

      if (node) observer.current.observe(node);
    },
    [loading, hasMore]
  );

  useEffect(() => {
    const fetchUserPosts = async () => {
      if (!public_id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Missing authentication token.');

        const response = await fetch(`https://cookeat.cookeat.space/query/feed/posts?page=${page}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) throw new Error('Failed to fetch posts');
        const data = await response.json();

        const userPosts = data.posts.filter(post => post.author?.public_id === public_id);
        setPosts(prev => [...prev, ...userPosts]);

        if (userPosts.length < 10) setHasMore(false);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserPosts();
  }, [page, public_id]);

  useEffect(() => {
    const restoreScroll = () => window.scrollTo(0, scrollY);
    const timeout = setTimeout(restoreScroll, 100);
    return () => {
      clearTimeout(timeout);
      setScrollY(window.scrollY);
    };
  }, [scrollY]);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="feed-page-container">
      <div className="feed-posts">
        {posts.map((post, index) => {
          const isLast = index === posts.length - 1;
          return (
            <FeedPost
              key={post.public_id}
              public_id={post.public_id}
              title={post.title}
              content={post.content}
              view_count={post.view_count}
              created_at={new Date(post.created_at).toLocaleString()}
              updated_at={new Date(post.updated_at).toLocaleString()}
              media_filename={post.media[0]?.media_filename}
              media_type={post.media[0]?.media_type}
              reactions_total={post.reactions.total}
              user_reacted={post.user_reacted}
              comment_count={post.comment_count}
              ref_public_id={post.ref_public_id}
              author_public_id={post.author.public_id}
              author_username={post.author.username}
              author_picture={post.author.picture}
              ref={isLast ? lastPostRef : null}
            />
          );
        })}

        {loading && [...Array(3)].map((_, i) => <FeedPostSkeleton key={`skeleton-${i}`} />)}
        {error && <p className="feed-status-message">Error: {error}</p>}
        {!hasMore && posts.length > 0 && (
          <p className="feed-status-message">No more posts to show.</p>
        )}
        {!loading && posts.length === 0 && (
          <p className="feed-status-message">This user has no posts yet.</p>
        )}
      </div>
    </div>
  );
}

export default OtherUserFeedPage;
