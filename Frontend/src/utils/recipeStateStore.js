import { create } from 'zustand';

const RecipeStateStore = create((set) => ({
  recipes: [],
  page: 1,
  hasMore: true,
  scrollY: 0,
  setRecipes: (recipes) =>
    set((state) => ({
      recipes: typeof recipes === 'function' ? recipes(state.recipes) : recipes,
    })),
  incrementPage: () => set((state) => ({ page: state.page + 1 })),
  setHasMore: (value) => set({ hasMore: value }),
  setScrollY: (value) => set({ scrollY: value }),
}));

export default RecipeStateStore;
