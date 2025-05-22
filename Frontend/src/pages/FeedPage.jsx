import React, { useEffect, useRef, useCallback, useState } from 'react';
import FeedPost from './../components/FeedPost.jsx';
import PostSkeleton from '../components/PostSkeleton.jsx';
import FeedStateStore from '../utils/feedStateStore.js';
import LoginRegister from '../components/LoginRegister.jsx';
import './styles/feedpage.css';

function FeedPage({ profile, avatar }) {
  const {
    posts,
    page,
    hasMore,
    setPosts,
    incrementPage,
    setHasMore,
    scrollY,
    setScrollY,
  } = FeedStateStore();

  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [token, setToken] = useState(localStorage.getItem('token') || null);

  const observer = useRef();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const openLoginModal = () => setLoginModalOpen(true);
  const closeLoginModal = () => setLoginModalOpen(false);

  const lastPostRef = useCallback(
    (node) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMore) {
            incrementPage();
          }
        },
        { threshold: 0.5 }
      );

      if (node) observer.current.observe(node);
    },
    [loading, hasMore, incrementPage]
  );

  useEffect(() => {
    setPosts([]);
    setHasMore(true);
  }, [setPosts, setHasMore]);

  // Fetch posts data
  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      setError(null);

      try {
        // Get the token from localStorage
        const token = localStorage.getItem('token');

        // Add Authorization header with the token
        const response = await fetch(`https://cookeat.cookeat.space/query/feed/posts?page=${page}`, {
          method: 'GET', // assuming it's a GET request
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json', // Optional if needed
          },
        });

        if (!response.ok) throw new Error('Failed to fetch posts');

        const data = await response.json();

        if (data && Array.isArray(data.posts)) {
          setPosts(prevPosts => [...prevPosts, ...data.posts]);
          if (data.posts.length < 10) setHasMore(false);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);
  
  // Restore scroll position on mount and save it on unmount
  useEffect(() => {
    const restoreScrollPosition = () => {
      if (scrollY !== undefined) {
        window.scrollTo(0, scrollY);
      }
    };

    // Delay scroll restoration to ensure page is loaded
    const timeout = setTimeout(restoreScrollPosition, 100); // Delay by 100ms

    return () => {
      clearTimeout(timeout);
      setScrollY(window.scrollY);
    };
  }, [scrollY, setScrollY]);

  // Track scroll position during page scroll
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [setScrollY]);

  return (
    <div className="feed-page-container">
      <div className="feed-posts">
        {posts.map((post, index) => {
          const isLast = index === posts.length - 1;
          return (
            <FeedPost
              key={post.public_id}
              openLoginModal={openLoginModal}
              isLoggedIn={!!token}
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
              author_picture={
                post.author.public_id === profile?.public_id
                  ? avatar
                  : post.author.picture
              }
              session_username={profile?.username || ''}
              session_user_picture={profile?.avatar || ''}
              ref={isLast ? lastPostRef : null}
            />
          );
        })}
        {loading && [...Array(3)].map((_, i) => <PostSkeleton key={`skeleton-${i}`} />)}
        {error && <p className="feed-status-message">Error: {error}</p>}
        {!hasMore && <p className="feed-status-message">No more posts to show.</p>}
      </div>

      <LoginRegister
        isOpen={loginModalOpen}
        onClose={closeLoginModal}
        setToken={setToken}
      />
    </div>
  );
}

export default FeedPage;
