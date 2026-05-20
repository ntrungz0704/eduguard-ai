import { create } from 'zustand';
import { api, requestWithRestartRetry } from './lib/api';

export const useStore = create((set) => ({
  trainingData: null,
  isLoading: false,
  error: null,
  activeStudent: null,
  
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
