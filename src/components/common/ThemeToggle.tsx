import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '', showLabel = false }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      type="button"
      aria-label={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide border transition-all duration-200 cursor-pointer ${
        theme === 'dark'
          ? 'bg-slate-900/80 hover:bg-slate-800 text-slate-200 border-slate-700/80 shadow-sm hover:border-slate-600'
          : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300 shadow-sm hover:border-slate-400'
      } ${className}`}
    >
      {theme === 'dark' ? (
        <>
          <Sun className="w-3.5 h-3.5 text-amber-400 animate-in spin-in-180 duration-300" />
          {showLabel && <span>Light Mode</span>}
        </>
      ) : (
        <>
          <Moon className="w-3.5 h-3.5 text-indigo-600 animate-in spin-in-180 duration-300" />
          {showLabel && <span>Dark Mode</span>}
        </>
      )}
    </button>
  );
};
