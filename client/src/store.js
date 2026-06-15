import { create } from 'zustand';
import { api, requestWithRestartRetry } from './lib/api';

export const useStore = create((set) => ({
  theme: localStorage.getItem('eduguard-theme') || 'dark',
  trainingData: null,
  isLoading: false,
  error: null,
  activeStudent: null,
  currentUser: JSON.parse(localStorage.getItem('eduguard_user')) || null, // Stores { id, name, role, classCode }
  
  // Search state preservation for Teacher view
  searchQuery: '',
  sortType: 'name-asc',
  onlyShowAtRisk: false,
  
  setSearchQuery: (q) => set({ searchQuery: q }),
  setSortType: (t) => set({ sortType: t }),
  setOnlyShowAtRisk: (r) => set({ onlyShowAtRisk: r }),
  
  toggleTheme: () => set((state) => {
    const newTheme = state.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('eduguard-theme', newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    return { theme: newTheme };
  }),
  
  setCurrentUser: (user) => {
    if (user) {
      localStorage.setItem('eduguard_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('eduguard_user');
    }
    set({ currentUser: user });
  },
  
  fetchTrainingData: async () => {
    set({ isLoading: true });
    try {
      const res = await requestWithRestartRetry(() => api.get('/training-info'));
      set({ trainingData: res.data, isLoading: false, error: null });
    } catch (err) {
      set({ error: err.message, isLoading: false });
    }
  },
  
  setActiveStudent: (student) => set({ activeStudent: student }),
}));
