import React from 'react';
import { Sun, Moon, Laptop } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store';
import { setTheme } from '../store/uiSlice';

interface ThemeToggleProps {
  variant?: 'segmented' | 'compact';
}

export function ThemeToggle({ variant = 'segmented' }: ThemeToggleProps) {
  const dispatch = useAppDispatch();
  const theme = useAppSelector((state) => state.ui.theme);

  if (variant === 'compact') {
    const cycleTheme = () => {
      if (theme === 'system') dispatch(setTheme('dark'));
      else if (theme === 'dark') dispatch(setTheme('light'));
      else dispatch(setTheme('system'));
    };

    return (
      <button
        onClick={cycleTheme}
        className="p-2 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors flex items-center gap-1.5"
        title={`Current theme: ${theme}. Click to switch.`}
        aria-label="Toggle theme"
      >
        {theme === 'dark' ? (
          <Moon className="w-4 h-4 text-indigo-400" />
        ) : theme === 'light' ? (
          <Sun className="w-4 h-4 text-amber-500" />
        ) : (
          <Laptop className="w-4 h-4 text-neutral-400" />
        )}
        <span className="text-xs font-semibold capitalize hidden sm:inline">{theme}</span>
      </button>
    );
  }

  return (
    <div className="inline-flex items-center p-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs font-medium">
      <button
        onClick={() => dispatch(setTheme('light'))}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all ${
          theme === 'light'
            ? 'bg-white text-neutral-900 shadow-2xs font-bold'
            : 'text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-white'
        }`}
        title="Switch to Light Theme"
      >
        <Sun className={`w-3.5 h-3.5 ${theme === 'light' ? 'text-amber-500' : ''}`} />
        <span>Light</span>
      </button>

      <button
        onClick={() => dispatch(setTheme('dark'))}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all ${
          theme === 'dark'
            ? 'bg-neutral-900 text-white shadow-2xs font-bold'
            : 'text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-white'
        }`}
        title="Switch to Dark Theme"
      >
        <Moon className={`w-3.5 h-3.5 ${theme === 'dark' ? 'text-indigo-400' : ''}`} />
        <span>Dark</span>
      </button>

      <button
        onClick={() => dispatch(setTheme('system'))}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all ${
          theme === 'system'
            ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-2xs font-bold'
            : 'text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-white'
        }`}
        title="Switch to System Preference"
      >
        <Laptop className="w-3.5 h-3.5" />
        <span>System</span>
      </button>
    </div>
  );
}
