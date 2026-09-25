import React from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  BookOpen,
  Clock,
  CheckCircle,
  CalendarDays,
  CheckSquare,
  TrendingUp,
  ArrowRight,
  ExternalLink,
  Plus,
} from 'lucide-react';
import { useDashboardStats, useSessions, useAssignments, useStudents, useTracks } from '../db/hooks';
import { useAppDispatch } from '../store';
import { openAddPanel } from '../store/uiSlice';
import { formatDateDisplay, formatTimeDisplay } from '../utils/dateTime';

export function DashboardPage() {
  const dispatch = useAppDispatch();
  const stats = useDashboardStats();
  const sessions = useSessions();
  const assignments = useAssignments();
  const students = useStudents();
  const tracks = useTracks();

  const trackMap = new Map(tracks.map((t) => [t.id, t]));
  const recentSessions = sessions.slice(0, 5);
  const pendingAssignments = assignments.filter((a) => a.status !== 'Completed').slice(0, 5);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white font-heading tracking-tight">
            Mentoring Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Overview of student progress, session curriculum, attendance rate, and tasks
          </p>
        </div>

        <button
          onClick={() => dispatch(openAddPanel())}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Log Mentoring Session</span>
        </button>
      </div>

      {/* 6 Top Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Metric 1: Total Students */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-neutral-500 dark:text-neutral-400">
            <Users className="w-3.5 h-3.5 text-indigo-500" />
            <span>Students</span>
          </div>
          <div className="mt-2 text-2xl font-bold text-neutral-900 dark:text-white font-heading">
            {stats.totalStudents}
          </div>
          <p className="text-[11px] text-neutral-400 mt-0.5">active learners</p>
        </div>

        {/* Metric 2: Total Sessions */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-neutral-500 dark:text-neutral-400">
            <BookOpen className="w-3.5 h-3.5 text-blue-500" />
            <span>Sessions</span>
          </div>
          <div className="mt-2 text-2xl font-bold text-neutral-900 dark:text-white font-heading">
            {stats.totalSessions}
          </div>
          <p className="text-[11px] text-neutral-400 mt-0.5">sessions logged</p>
        </div>

        {/* Metric 3: Mentored Hours */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-neutral-500 dark:text-neutral-400">
            <Clock className="w-3.5 h-3.5 text-emerald-500" />
            <span>Mentored Time</span>
          </div>
          <div className="mt-2 text-2xl font-bold text-neutral-900 dark:text-white font-heading">
            {stats.totalHoursMentored}h
          </div>
          <p className="text-[11px] text-neutral-400 mt-0.5">total hours</p>
        </div>

        {/* Metric 4: Attendance Rate */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-neutral-500 dark:text-neutral-400">
            <CheckCircle className="w-3.5 h-3.5 text-teal-500" />
            <span>Attendance</span>
          </div>
          <div className="mt-2 text-2xl font-bold text-neutral-900 dark:text-white font-heading">
            {stats.attendanceRate}%
          </div>
          <p className="text-[11px] text-neutral-400 mt-0.5">overall rate</p>
        </div>

        {/* Metric 5: Pending Tasks */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-neutral-500 dark:text-neutral-400">
            <CheckSquare className="w-3.5 h-3.5 text-amber-500" />
            <span>Pending Tasks</span>
          </div>
          <div className="mt-2 text-2xl font-bold text-neutral-900 dark:text-white font-heading">
            {stats.pendingTasksCount}
          </div>
          <p className="text-[11px] text-neutral-400 mt-0.5">assignments</p>
        </div>

        {/* Metric 6: This Month */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-neutral-500 dark:text-neutral-400">
            <CalendarDays className="w-3.5 h-3.5 text-purple-500" />
            <span>This Month</span>
          </div>
          <div className="mt-2 text-2xl font-bold text-neutral-900 dark:text-white font-heading">
            {stats.sessionsThisMonth}
          </div>
          <p className="text-[11px] text-neutral-400 mt-0.5">sessions held</p>
        </div>
      </div>

      {/* Middle Section: Attendance Overview & Pending Assignments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Overview Card */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white font-heading">
                Attendance Overview
              </h3>
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                {stats.attendanceRate}% Rate
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs font-medium mb-1">
                  <span className="text-neutral-600 dark:text-neutral-300">Present ({stats.attendanceBreakdown.present})</span>
                  <span className="text-neutral-500">
                    {stats.totalSessions > 0
                      ? Math.round((stats.attendanceBreakdown.present / stats.totalSessions) * 100)
                      : 0}%
                  </span>
                </div>
                <div className="h-2 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-300 rounded-full"
                    style={{
                      width: `${stats.totalSessions > 0 ? (stats.attendanceBreakdown.present / stats.totalSessions) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium mb-1">
                  <span className="text-neutral-600 dark:text-neutral-300">Late / Excused ({stats.attendanceBreakdown.late + stats.attendanceBreakdown.excused})</span>
                  <span className="text-neutral-500">
                    {stats.totalSessions > 0
                      ? Math.round(((stats.attendanceBreakdown.late + stats.attendanceBreakdown.excused) / stats.totalSessions) * 100)
                      : 0}%
                  </span>
                </div>
                <div className="h-2 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 transition-all duration-300 rounded-full"
                    style={{
                      width: `${stats.totalSessions > 0 ? ((stats.attendanceBreakdown.late + stats.attendanceBreakdown.excused) / stats.totalSessions) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium mb-1">
                  <span className="text-neutral-600 dark:text-neutral-300">Absent ({stats.attendanceBreakdown.absent})</span>
                  <span className="text-neutral-500">
                    {stats.totalSessions > 0
                      ? Math.round((stats.attendanceBreakdown.absent / stats.totalSessions) * 100)
                      : 0}%
                  </span>
                </div>
                <div className="h-2 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-rose-500 transition-all duration-300 rounded-full"
                    style={{
                      width: `${stats.totalSessions > 0 ? (stats.attendanceBreakdown.absent / stats.totalSessions) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs text-neutral-500">
            <span>Track breakdown ready</span>
            <Link to="/analytics" className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-1">
              <span>View Analytics</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Pending Assignments List Card */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white font-heading">
                Pending Assignments
              </h3>
              <Link to="/assignments" className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
                View All ({assignments.length})
              </Link>
            </div>

            {pendingAssignments.length > 0 ? (
              <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {pendingAssignments.map((a) => (
                  <div key={a.id} className="py-2.5 flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="text-xs font-semibold text-neutral-900 dark:text-white line-clamp-1">
                        {a.taskTitle}
                      </div>
                      <div className="text-[11px] text-neutral-500 flex items-center gap-2">
                        <span>{a.studentName}</span>
                        <span>•</span>
                        <span>Due: {formatDateDisplay(a.dueDate)}</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800 shrink-0">
                      {a.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-neutral-400 italic">
                No pending assignments! All tasks are completed.
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800 text-right">
            <Link to="/assignments" className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1">
              <span>Manage Assignments</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom Section: Recent Sessions Table Preview */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white font-heading">
              Recent Mentoring Sessions
            </h3>
            <p className="text-xs text-neutral-500">Latest curriculum logs and student attendance</p>
          </div>

          <Link to="/sessions" className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">
            <span>View All Sessions ({sessions.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentSessions.length > 0 ? (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/80 dark:bg-neutral-800/50 text-neutral-500 font-semibold">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Student</th>
                  <th className="py-2.5 px-3">Track</th>
                  <th className="py-2.5 px-3">Duration</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Topics Taught</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {recentSessions.map((s) => {
                  const trackObj = trackMap.get(s.trackId);
                  return (
                    <tr key={s.id} className="hover:bg-neutral-50/60 dark:hover:bg-neutral-800/40">
                      <td className="py-2.5 px-3 font-semibold text-neutral-900 dark:text-white whitespace-nowrap">
                        {formatDateDisplay(s.date)}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-neutral-800 dark:text-neutral-200 whitespace-nowrap">
                        {s.studentName}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border"
                          style={{
                            backgroundColor: `${trackObj?.color || '#64748B'}15`,
                            borderColor: `${trackObj?.color || '#64748B'}35`,
                            color: trackObj?.color || '#64748B',
                          }}
                        >
                          {trackObj?.name || s.trackId}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-neutral-600 dark:text-neutral-400 whitespace-nowrap">
                        {s.durationText}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="font-semibold px-2 py-0.5 rounded-full text-[11px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800">
                          {s.classStatus}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 max-w-xs truncate text-neutral-600 dark:text-neutral-400">
                        {s.topicsTaught || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-neutral-400 italic">
            No sessions logged yet. Click "Log Mentoring Session" to record your first class!
          </div>
        )}
      </div>
    </div>
  );
}
