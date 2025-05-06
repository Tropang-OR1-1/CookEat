import { create } from 'zustand';

const useFeedStore = create((set) => ({
  posts: [],
  page: 1,
  hasMore: true,
  scrollY: 0,
  setPosts: (posts) => set((state) => ({
    posts: typeof posts === 'function' ? posts(state.posts) : posts,
  })),
  incrementPage: () => set((state) => ({ page: state.page + 1 })),
  setHasMore: (value) => set({ hasMore: value }),
  setScrollY: (value) => set({ scrollY: value }),
}));

export default useFeedStore;
