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
      className={`inline-flex items-center justify-center transition-all duration-200 cursor-pointer ${
        showLabel
          ? 'gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide border'
          : 'w-8 h-8 rounded-full border'
      } ${
        theme === 'dark'
          ? 'bg-white/5 hover:bg-white/10 text-amber-400 border-white/10 shadow-xs hover:border-white/20'
          : 'bg-slate-100/80 hover:bg-slate-200/80 text-amber-500 border-slate-200/80 shadow-xs hover:border-slate-300'
      } ${className}`}
    >
      {theme === 'dark' ? (
        <>
          <Sun className="w-3.5 h-3.5 text-amber-400" />
          {showLabel && <span className="text-slate-200">Light Mode</span>}
        </>
      ) : (
        <>
          <Sun className="w-3.5 h-3.5 text-amber-500" />
          {showLabel && <span className="text-slate-700">Dark Mode</span>}
        </>
      )}
    </button>
  );
};
