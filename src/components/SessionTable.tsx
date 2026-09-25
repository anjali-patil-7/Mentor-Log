import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'motion/react';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Calendar,
  BookOpen,
  Plus,
  RotateCcw,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store';
import { toggleSort, resetFilters } from '../store/filtersSlice';
import { openAddPanel } from '../store/uiSlice';
import { useFilteredSessions, useTracks } from '../db/hooks';
import { SortField } from '../types';
import { SessionRow } from './SessionRow';
import { Pagination } from './Pagination';

export function SessionTable() {
  const dispatch = useAppDispatch();
  const filters = useAppSelector((state) => state.filters);
  const tracks = useTracks();

  const { filteredSessions, totalSessions } = useFilteredSessions(filters);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Reset pagination to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const sortField = filters.sortField;
  const sortDirection = filters.sortDirection;

  const trackMap = new Map(tracks.map((t) => [t.id, t]));

  const hasActiveFilters = Boolean(
    filters.searchQuery.trim() ||
      filters.studentId !== 'all' ||
      filters.trackId !== 'all' ||
      filters.sessionStatus !== 'all' ||
      filters.attendance !== 'all' ||
      filters.datePreset !== 'all'
  );

  const totalPages = Math.ceil(filteredSessions.length / pageSize);
  const paginatedSessions = filteredSessions.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleHeaderClick = (field: SortField) => {
    dispatch(toggleSort(field));
  };

  const renderSortIndicator = (field: SortField) => {
    if (sortField !== field) {
      return (
        <ArrowUpDown className="w-3 h-3 text-neutral-400 opacity-40 group-hover:opacity-100 transition-opacity" />
      );
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
    );
  };

  // State 1: No sessions in database
  if (totalSessions.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-md mx-auto text-center p-8 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xs">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center mb-4">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-neutral-900 dark:text-white font-heading">
            No mentoring sessions logged yet
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1.5 leading-relaxed">
            Record student attendance, topics covered, recordings, and assignments.
          </p>
          <div className="mt-6">
            <button
              onClick={() => dispatch(openAddPanel())}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Log Your First Session</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // State 2: Sessions exist, but current filters match nothing
  if (filteredSessions.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="max-w-md mx-auto text-center p-8 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xs">
          <div className="w-12 h-12 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-500 mx-auto flex items-center justify-center mb-4">
            <Calendar className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-neutral-900 dark:text-white font-heading">
            No matching sessions found
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1.5">
            Try changing your search keywords or clearing active filters.
          </p>
          {hasActiveFilters && (
            <div className="mt-5">
              <button
                onClick={() => dispatch(resetFilters())}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 text-xs font-semibold transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset All Filters</span>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/80 dark:bg-neutral-900/90 text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                <th
                  onClick={() => handleHeaderClick('date')}
                  className="py-3 px-4 cursor-pointer hover:bg-neutral-100/70 dark:hover:bg-neutral-800/70 transition-colors select-none group whitespace-nowrap"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Date & Day</span>
                    {renderSortIndicator('date')}
                  </div>
                </th>

                <th
                  onClick={() => handleHeaderClick('studentName')}
                  className="py-3 px-4 cursor-pointer hover:bg-neutral-100/70 dark:hover:bg-neutral-800/70 transition-colors select-none group whitespace-nowrap"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Student</span>
                    {renderSortIndicator('studentName')}
                  </div>
                </th>

                <th
                  onClick={() => handleHeaderClick('track')}
                  className="py-3 px-4 cursor-pointer hover:bg-neutral-100/70 dark:hover:bg-neutral-800/70 transition-colors select-none group whitespace-nowrap"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Domain & Course</span>
                    {renderSortIndicator('track')}
                  </div>
                </th>

                <th
                  onClick={() => handleHeaderClick('duration')}
                  className="py-3 px-4 cursor-pointer hover:bg-neutral-100/70 dark:hover:bg-neutral-800/70 transition-colors select-none group whitespace-nowrap"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Time & Duration</span>
                    {renderSortIndicator('duration')}
                  </div>
                </th>

                <th
                  onClick={() => handleHeaderClick('sessionStatus')}
                  className="py-3 px-4 cursor-pointer hover:bg-neutral-100/70 dark:hover:bg-neutral-800/70 transition-colors select-none group whitespace-nowrap"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Status</span>
                    {renderSortIndicator('sessionStatus')}
                  </div>
                </th>

                <th className="py-3 px-4 whitespace-nowrap">
                  Attendance
                </th>

                <th className="py-3 px-4 min-w-[200px] whitespace-nowrap">
                  Topics Taught
                </th>

                <th className="py-3 px-4 min-w-[180px] whitespace-nowrap">
                  Task / Assignment
                </th>

                <th className="py-3 px-4 whitespace-nowrap">
                  Recording Link
                </th>

                <th className="py-3 px-4 text-right whitespace-nowrap">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/80">
              <AnimatePresence initial={false}>
                {paginatedSessions.map((session) => (
                  <SessionRow
                    key={session.id}
                    session={session}
                    track={trackMap.get(session.trackId)}
                  />
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredSessions.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setCurrentPage(1);
          }}
        />
      </div>
    </div>
  );
}
