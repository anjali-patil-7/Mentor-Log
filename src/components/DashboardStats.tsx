import React from 'react';
import {
  CalendarDays,
  Clock,
  CheckCircle,
  Layers,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store';
import { useDashboardStats } from '../db/hooks';
import { setTrackFilter } from '../store/filtersSlice';

export function DashboardStats() {
  const stats = useDashboardStats();
  const activeTrackFilter = useAppSelector((state) => state.filters.trackId);
  const dispatch = useAppDispatch();

  return (
    <div className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 py-4 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6 divide-y sm:divide-y-0 sm:divide-x divide-neutral-100 dark:divide-neutral-800">
          {/* Stat 1: Total Sessions */}
          <div className="pt-2 sm:pt-0 sm:pr-4">
            <div className="flex items-center gap-2 text-xs font-medium text-neutral-500 dark:text-neutral-400">
              <Layers className="w-3.5 h-3.5 text-neutral-400" />
              <span>Total Sessions</span>
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white font-heading">
                {stats.totalSessions}
              </span>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                logged
              </span>
            </div>
          </div>

          {/* Stat 2: Total Hours Mentored */}
          <div className="pt-2 sm:pt-0 sm:px-4">
            <div className="flex items-center gap-2 text-xs font-medium text-neutral-500 dark:text-neutral-400">
              <Clock className="w-3.5 h-3.5 text-neutral-400" />
              <span>Mentored Time</span>
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white font-heading">
                {stats.totalHoursMentored}
              </span>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                hours
              </span>
            </div>
          </div>

          {/* Stat 3: Current Activity */}
          <div className="pt-2 sm:pt-0 sm:px-4">
            <div className="flex items-center gap-2 text-xs font-medium text-neutral-500 dark:text-neutral-400">
              <CalendarDays className="w-3.5 h-3.5 text-neutral-400" />
              <span>Current Activity</span>
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white font-heading">
                {stats.sessionsThisWeek}
              </span>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                this week
              </span>
              <span className="text-xs text-neutral-300 dark:text-neutral-700">/</span>
              <span className="text-xs font-medium text-neutral-600 dark:text-neutral-300">
                {stats.sessionsThisMonth} this month
              </span>
            </div>
          </div>

          {/* Stat 4: Track Breakdown & Status */}
          <div className="pt-2 sm:pt-0 sm:pl-4 col-span-2 md:col-span-1">
            <div className="flex items-center justify-between text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5">
              <span>Track Distribution</span>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold">
                <CheckCircle className="w-3 h-3" />
                {stats.statusBreakdown.completed} completed
              </span>
            </div>

            {/* Visual mini-distribution bar */}
            {stats.totalSessions > 0 ? (
              <div className="h-2 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden flex">
                {stats.trackBreakdown.map((t) => (
                  <div
                    key={t.trackId}
                    style={{
                      width: `${t.percentage}%`,
                      backgroundColor: t.color,
                    }}
                    title={`${t.trackName}: ${t.count} sessions (${t.percentage}%)`}
                    className="h-full transition-all duration-300 first:rounded-l-full last:rounded-r-full"
                  />
                ))}
              </div>
            ) : (
              <div className="h-2 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full" />
            )}

            {/* Quick interactive track pills */}
            <div className="mt-2 flex flex-wrap gap-1.5 items-center">
              {stats.trackBreakdown.map((t) => {
                const isActive = activeTrackFilter === t.trackId;
                return (
                  <button
                    key={t.trackId}
                    onClick={() =>
                      dispatch(setTrackFilter(isActive ? 'all' : t.trackId))
                    }
                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border transition-colors ${
                      isActive
                        ? 'border-neutral-900 dark:border-white font-bold'
                        : 'border-transparent hover:border-neutral-200 dark:hover:border-neutral-700'
                    }`}
                    style={{
                      backgroundColor: `${t.color}15`,
                      color: t.color,
                    }}
                    title={`Click to filter by ${t.trackName}`}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: t.color }}
                    />
                    <span>{t.trackName}</span>
                    <span className="text-neutral-500 dark:text-neutral-400 font-mono">
                      {t.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
