import React from 'react';
import { useStore } from '../store';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const theme = useStore(state => state.theme);
  const toggleTheme = useStore(state => state.toggleTheme);

  return (
    <button
      onClick={toggleTheme}
      className="p-2.5 rounded-full hover:bg-slate-500/20 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-all focus:outline-none"
      title="Toggle Dark/Light Mode"
    >
      {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
}
