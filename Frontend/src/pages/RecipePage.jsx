import React, { useEffect, useRef, useCallback, useState } from 'react';
import RecipePost from './../components/RecipePage/RecipePost.jsx';
import PostSkeleton from '../components/PostSkeleton.jsx';
import RecipeStateStore from './../utils/recipeStateStore.js';
import './styles/recipepage.css';

function RecipePage() {
  const {
    recipes,
    page,
    hasMore,
    setRecipes,
    incrementPage,
    setHasMore,
    scrollY,
    setScrollY,
  } = RecipeStateStore();

  const observer = useRef();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Intersection Observer callback to implement infinite scroll
  const lastRecipeRef = useCallback(
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

  // Disconnect observer on unmount
  useEffect(() => {
    return () => {
      if (observer.current) observer.current.disconnect();
    };
  }, []);

  // Fetch recipes on page change
  useEffect(() => {
    let isMounted = true;

    const fetchRecipes = async () => {
      if (loading) return;
      setLoading(true);
      setError(null);

      try {
        const token = localStorage.getItem('token');
        const response = await fetch(
          `https://cookeat.cookeat.space/query/feed/recipes?page=${page}`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) throw new Error('Failed to fetch recipes');

        const data = await response.json();

        if (isMounted) {
          if (data && Array.isArray(data.recipes)) {
            setRecipes((prevrecipes) => [...prevrecipes, ...data.recipes]);
            if (data.recipes.length < 10) setHasMore(false);
          } else {
            setHasMore(false);
            setError('Invalid data format or no recipes');
          }
        }
      } catch (err) {
        if (isMounted) setError(err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchRecipes();

    return () => {
      isMounted = false;
    };
  }, [page, setRecipes, setHasMore]);  // <-- Removed loading here

  // Restore scroll position on mount/update
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

  // Track scrollY to save scroll position
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [setScrollY]);

  return (
    <div className="recipe-page-container">
      <div className="recipe-posts">
        {/* Show message if no recipes and not loading or error */}
        {recipes.length === 0 && !loading && !error && (
          <p className="recipe-status-message">No recipes available.</p>
        )}

        {recipes.map((recipe, index) => {
          const isLast = index === recipes.length - 1;
          return (
            <RecipePost
              key={recipe.public_id}
              public_id={recipe.public_id}
              title={recipe.title}
              description={recipe.description}
              view_count={recipe.view_count}
              created_at={recipe.created_at}
              updated_at={recipe.updated_at}
              prep_time={recipe.prep_time}
              cook_time={recipe.cook_time}
              servings={recipe.servings}
              difficulty={recipe.difficulty}
              steps={recipe.steps}
              avg_rating={recipe.avg_rating}
              user_rating={recipe.user_rating}
              ratings_total={recipe.ratings.total}
              author_picture={recipe.author.picture}
              author_username={recipe.author.username}
              author_public_id={recipe.author.public_id}
              media={recipe.media}
              ingredients={recipe.ingredients}
              ref={isLast ? lastRecipeRef : null}
            />
          );
        })}

        {/* Show loading skeletons while loading */}
        {loading &&
          [...Array(3)].map((_, i) => <PostSkeleton key={`skeleton-${i}`} />)}

        <div className="recipe-status-wrapper">
          {error && <p className="recipe-status-message">Error: {error}</p>}
          {!hasMore && !loading && (
            <p className="recipe-status-message">No more recipes to show.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default RecipePage;
