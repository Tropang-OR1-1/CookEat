import React, { useEffect, useRef, useCallback } from 'react';
import RecipePost from './../components/RecipePage/RecipePost.jsx';
import PostSkeleton from '../components/PostSkeleton.jsx';
import RecipeStateStore from './../utils/recipeStateStore.js';
import './styles/recipepage.css';

function RecipePage() {
  const {
    posts,
    page,
    hasMore,
    setRecipes,
    incrementPage,
    setHasMore,
    scrollY,
    setScrollY,
  } = RecipeStateStore();

  const observer = useRef();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  const lastPostRef = useCallback(
    (node) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMore && !loading) {
            incrementPage();
          }
        },
        { threshold: 0.5 }
      );

      if (node) observer.current.observe(node);
    },
    [loading, hasMore, incrementPage]
  );

  // Clean up observer on unmount
  useEffect(() => {
    return () => {
      if (observer.current) observer.current.disconnect();
    };
  }, []);

  // Fetch recipe data
  useEffect(() => {
    let isMounted = true;

    const fetchPosts = async () => {
      if (loading) return; // Prevent duplicate fetches
      setLoading(true);
      setError(null);

      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`https://cookeat.cookeat.space/query/feed/recipes?page=${page}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) throw new Error('Failed to fetch posts');

        const data = await response.json();

        if (isMounted) {
          if (data && Array.isArray(data.posts)) {
            setRecipes(prevPosts => [...prevPosts, ...data.posts]);
            if (data.posts.length < 10) setHasMore(false);
          } else {
            setHasMore(false);
            setError('Invalid data format or no posts');
          }
        }
      } catch (err) {
        if (isMounted) setError(err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchPosts();

    return () => {
      isMounted = false;
    };
  }, [page, loading, setRecipes, setHasMore]);

  // Restore scroll position on mount, save on unmount
  useEffect(() => {
    const restoreScrollPosition = () => {
      if (scrollY !== undefined) {
        window.scrollTo(0, scrollY);
      }
    };

    const timeout = setTimeout(restoreScrollPosition, 100);
    return () => {
      clearTimeout(timeout);
      setScrollY(window.scrollY);
    };
  }, [scrollY, setScrollY]);

  // Track scroll position
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [setScrollY]);

  return (
    <div className="recipe-page-container">
      <div className="recipe-posts">
        {posts.map((post, index) => {
          const isLast = index === posts.length - 1;
          return (
            <RecipePost
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

        {loading && [...Array(3)].map((_, i) => (
          <PostSkeleton key={`skeleton-${i}`} />
        ))}

        <div className="feed-status-wrapper">
          {error && <p className="feed-status-message">Error: {error}</p>}
          {!hasMore && !loading && <p className="feed-status-message">No more posts to show.</p>}
        </div>
      </div>
    </div>
  );
}

export default RecipePage;
