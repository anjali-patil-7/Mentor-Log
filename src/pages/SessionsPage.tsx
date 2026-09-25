import React from 'react';
import { Plus, BookOpen } from 'lucide-react';
import { FilterBar } from '../components/FilterBar';
import { SessionTable } from '../components/SessionTable';
import { useAppDispatch } from '../store';
import { openAddPanel } from '../store/uiSlice';

export function SessionsPage() {
  const dispatch = useAppDispatch();

  return (
    <div className="flex flex-col min-h-full">
      {/* Top Page Banner Header */}
      <div className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white font-heading tracking-tight">
              Mentoring Sessions Log
            </h1>
            <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
              Filter by student, track, status, or date range • Record curriculum, assignments & recordings
            </p>
          </div>

          <button
            onClick={() => dispatch(openAddPanel())}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Log Mentoring Session</span>
          </button>
        </div>
      </div>

      {/* Main FilterBar & Session Table */}
      <div className="flex-1">
        <FilterBar />
        <SessionTable />
      </div>
    </div>
  );
}
