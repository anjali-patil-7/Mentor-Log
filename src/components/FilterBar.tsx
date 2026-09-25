import React from 'react';
import { Search, X, RotateCcw, Calendar } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store';
import {
  setSearchQuery,
  setStudentFilter,
  setTrackFilter,
  setStatusFilter,
  setAttendanceFilter,
  setDatePreset,
  setCustomDateRange,
  resetFilters,
} from '../store/filtersSlice';
import { useStudents, useTracks, useFilteredSessions } from '../db/hooks';
import { SessionStatus, AttendanceStatus, DatePreset } from '../types';

export function FilterBar() {
  const dispatch = useAppDispatch();
  const filters = useAppSelector((state) => state.filters);

  const students = useStudents();
  const tracks = useTracks();

  const { filteredSessions, totalSessions } = useFilteredSessions(filters);
  const totalCount = totalSessions.length;
  const filteredCount = filteredSessions.length;

  const hasActiveFilters = Boolean(
    filters.searchQuery.trim() ||
      filters.studentId !== 'all' ||
      filters.trackId !== 'all' ||
      filters.sessionStatus !== 'all' ||
      filters.attendance !== 'all' ||
      filters.datePreset !== 'all' ||
      filters.startDate ||
      filters.endDate
  );

  const activeStudent = students.find((s) => s.studentId === filters.studentId);
  const activeTrack = tracks.find((t) => t.id === filters.trackId);

  return (
    <div className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 px-4 sm:px-6 lg:px-8 py-3.5 space-y-3">
      {/* Main Controls Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Left: Smart Search Bar */}
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            value={filters.searchQuery}
            onChange={(e) => dispatch(setSearchQuery(e.target.value))}
            placeholder="Search student, ID, topic, assignment, remarks..."
            className="w-full pl-9 pr-8 py-1.5 text-xs sm:text-sm bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
          {filters.searchQuery && (
            <button
              onClick={() => dispatch(setSearchQuery(''))}
              className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Right: Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* 1. Student Filter */}
          <select
            id="filter-student"
            value={filters.studentId}
            onChange={(e) => dispatch(setStudentFilter(e.target.value))}
            aria-label="Filter by student"
            className="px-2.5 py-1.5 text-xs bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium"
          >
            <option value="all">All Students</option>
            {students.map((s) => (
              <option key={s.id} value={s.studentId}>
                {s.studentName} ({s.studentId})
              </option>
            ))}
          </select>

          {/* 2. Domain Filter (was Track) */}
          <select
            id="filter-domain"
            value={filters.trackId}
            onChange={(e) => dispatch(setTrackFilter(e.target.value))}
            aria-label="Filter by domain"
            className="px-2.5 py-1.5 text-xs bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium"
          >
            <option value="all">All Domains</option>
            {tracks.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>

          {/* 3. Session Status Filter */}
          <select
            id="filter-status"
            value={filters.sessionStatus}
            onChange={(e) => dispatch(setStatusFilter(e.target.value as any))}
            aria-label="Filter by session status"
            className="px-2.5 py-1.5 text-xs bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium"
          >
            <option value="all">All Statuses</option>
            <option value="Completed">Completed</option>
            <option value="Rescheduled">Rescheduled</option>
            <option value="Cancelled">Cancelled</option>
            <option value="Pending">Pending</option>
            <option value="Holiday">Holiday</option>
          </select>

          {/* 4. Attendance Filter */}
          <select
            id="filter-attendance"
            value={filters.attendance}
            onChange={(e) => dispatch(setAttendanceFilter(e.target.value as any))}
            aria-label="Filter by attendance"
            className="px-2.5 py-1.5 text-xs bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium"
          >
            <option value="all">All Attendance</option>
            <option value="Present">Present</option>
            <option value="Absent">Absent</option>
            <option value="Late">Late</option>
            <option value="Excused">Excused</option>
            <option value="Holiday">Holiday</option>
            <option value="Not Applicable">N/A</option>
          </select>

          {/* 5. Date Range Preset Filter */}
          <select
            id="filter-date-preset"
            value={filters.datePreset}
            onChange={(e) => dispatch(setDatePreset(e.target.value as DatePreset))}
            aria-label="Filter by date"
            className="px-2.5 py-1.5 text-xs bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium"
          >
            <option value="all">All Dates</option>
            <option value="today">Today</option>
            <option value="this_week">This Week</option>
            <option value="this_month">This Month</option>
            <option value="custom">Custom Range...</option>
          </select>

          {/* Result Counter */}
          <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400 pl-1">
            {filteredCount} of {totalCount}
          </span>
        </div>
      </div>

      {/* Active Filter Dismiss Pills */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
          <span className="text-neutral-400 text-[11px] font-semibold uppercase tracking-wider">Active Filters:</span>

          {filters.searchQuery && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs">
              "{filters.searchQuery}"
              <button onClick={() => dispatch(setSearchQuery(''))} aria-label="Clear search filter">
                <X className="w-3 h-3 hover:text-indigo-900" />
              </button>
            </span>
          )}

          {activeStudent && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-medium">
              Student: {activeStudent.studentName}
              <button onClick={() => dispatch(setStudentFilter('all'))} aria-label="Clear student filter">
                <X className="w-3 h-3 hover:text-indigo-900" />
              </button>
            </span>
          )}

          {activeTrack && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-medium">
              Domain: {activeTrack.name}
              <button onClick={() => dispatch(setTrackFilter('all'))} aria-label="Clear domain filter">
                <X className="w-3 h-3 hover:text-indigo-900" />
              </button>
            </span>
          )}

          {filters.sessionStatus !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-medium">
              Status: {filters.sessionStatus}
              <button onClick={() => dispatch(setStatusFilter('all'))} aria-label="Clear status filter">
                <X className="w-3 h-3 hover:text-indigo-900" />
              </button>
            </span>
          )}

          {filters.attendance !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-medium">
              Attendance: {filters.attendance}
              <button onClick={() => dispatch(setAttendanceFilter('all'))} aria-label="Clear attendance filter">
                <X className="w-3 h-3 hover:text-indigo-900" />
              </button>
            </span>
          )}

          <button
            onClick={() => dispatch(resetFilters())}
            className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline ml-1"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Clear All</span>
          </button>
        </div>
      )}

      {/* Custom Date Range Inputs */}
      {filters.datePreset === 'custom' && (
        <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 flex items-center gap-2 text-xs">
          <Calendar className="w-3.5 h-3.5 text-neutral-400" />
          <span className="text-neutral-500 font-medium">Date Range:</span>
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => dispatch(setCustomDateRange({ startDate: e.target.value, endDate: filters.endDate }))}
            aria-label="Start date filter"
            className="px-2 py-1 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded text-neutral-800 dark:text-neutral-200"
          />
          <span className="text-neutral-400">to</span>
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => dispatch(setCustomDateRange({ startDate: filters.startDate, endDate: e.target.value }))}
            aria-label="End date filter"
            className="px-2 py-1 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded text-neutral-800 dark:text-neutral-200"
          />
        </div>
      )}
    </div>
  );
}
