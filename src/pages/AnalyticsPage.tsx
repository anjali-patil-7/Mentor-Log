import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { BarChart3, Clock, Users, Layers, TrendingUp, Calendar, BookOpen } from 'lucide-react';
import { useDashboardStats, useSessions, useStudents, useTracks, useFilteredSessions } from '../db/hooks';
import { useAppSelector } from '../store';
import { FilterBar } from '../components/FilterBar';

export function AnalyticsPage() {
  const stats = useDashboardStats();
  const allSessions = useSessions();
  const students = useStudents();
  const tracks = useTracks();

  const filters = useAppSelector((state) => state.filters);
  const { filteredSessions: sessions } = useFilteredSessions(filters);

  const [timeGroup, setTimeGroup] = useState<'day' | 'month'>('month');

  // 1. Sessions Over Time Chart Data
  const dateMap = new Map<string, number>();
  sessions.forEach((s) => {
    const key = timeGroup === 'month' ? s.date.substring(0, 7) : s.date;
    dateMap.set(key, (dateMap.get(key) || 0) + 1);
  });

  const sessionsOverTimeData = Array.from(dateMap.entries())
    .map(([date, count]) => ({ date, sessions: count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // 2. Hours by Student Chart Data
  const studentHoursMap = new Map<string, number>();
  sessions.forEach((s) => {
    const status = s.sessionStatus || s.classStatus || 'Completed';
    if (status === 'Completed') {
      const name = s.studentName || 'Unknown';
      studentHoursMap.set(name, (studentHoursMap.get(name) || 0) + (s.durationMinutes || 0));
    }
  });

  const hoursByStudentData = Array.from(studentHoursMap.entries())
    .map(([studentName, minutes]) => ({
      studentName,
      hours: Number((minutes / 60).toFixed(1)),
    }))
    .sort((a, b) => b.hours - a.hours)
    .slice(0, 8);

  // 3. Sessions by Domain (Track) Chart Data
  const trackCountMap = new Map<string, number>();
  sessions.forEach((s) => {
    trackCountMap.set(s.trackId, (trackCountMap.get(s.trackId) || 0) + 1);
  });

  const sessionsByTrackData = tracks.map((t) => ({
    name: t.name,
    value: trackCountMap.get(t.id) || 0,
    color: t.color,
  })).filter((t) => t.value > 0);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header Bar */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white font-heading tracking-tight">
          Analytics & Metrics
        </h1>
        <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
          Visual insights into mentoring sessions over time, student hours, and domain distributions
        </p>
      </div>

      {/* Filter Controls */}
      <div className="-mx-4 sm:-mx-6 lg:-mx-8">
        <FilterBar />
      </div>

      {/* Top 4 Key Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-neutral-500">
            <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
            <span>Total Logged Sessions</span>
          </div>
          <div className="mt-2 text-2xl font-bold text-neutral-900 dark:text-white font-heading">
            {stats.totalSessions}
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-neutral-500">
            <Clock className="w-3.5 h-3.5 text-emerald-500" />
            <span>Total Mentored Time</span>
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-heading">
            {stats.totalHoursMentored} hrs
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-neutral-500">
            <Users className="w-3.5 h-3.5 text-blue-500" />
            <span>Total Students</span>
          </div>
          <div className="mt-2 text-2xl font-bold text-neutral-900 dark:text-white font-heading">
            {stats.totalStudents}
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-neutral-500">
            <TrendingUp className="w-3.5 h-3.5 text-purple-500" />
            <span>Overall Attendance</span>
          </div>
          <div className="mt-2 text-2xl font-bold text-purple-600 dark:text-purple-400 font-heading">
            {stats.attendanceRate}%
          </div>
        </div>
      </div>

      {/* Chart 1: Sessions Over Time */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-neutral-900 dark:text-white font-heading">
              Sessions Over Time
            </h3>
            <p className="text-xs text-neutral-500">Volume of completed mentoring sessions</p>
          </div>

          <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-lg text-xs font-semibold">
            <button
              onClick={() => setTimeGroup('month')}
              className={`px-3 py-1 rounded-md transition-colors ${
                timeGroup === 'month'
                  ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-2xs'
                  : 'text-neutral-500'
              }`}
            >
              By Month
            </button>
            <button
              onClick={() => setTimeGroup('day')}
              className={`px-3 py-1 rounded-md transition-colors ${
                timeGroup === 'day'
                  ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-2xs'
                  : 'text-neutral-500'
              }`}
            >
              By Date
            </button>
          </div>
        </div>

        <div className="h-64 w-full">
          {sessionsOverTimeData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sessionsOverTimeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1E293B',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    color: '#FFF',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="sessions" fill="#6366F1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-neutral-400 italic">
              No session timeline data available.
            </div>
          )}
        </div>
      </div>

      {/* Grid: Hours by Student & Sessions by Track */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 2: Hours by Student */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-2xs space-y-4">
          <div>
            <h3 className="text-base font-bold text-neutral-900 dark:text-white font-heading">
              Mentored Hours by Student
            </h3>
            <p className="text-xs text-neutral-500">Top students by total completed mentoring time</p>
          </div>

          <div className="h-64 w-full">
            {hoursByStudentData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hoursByStudentData} layout="vertical" margin={{ top: 0, right: 10, left: 20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.3} />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="studentName" type="category" tick={{ fontSize: 11 }} width={100} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1E293B',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      color: '#FFF',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="hours" fill="#10B981" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-neutral-400 italic">
                No student mentoring time recorded.
              </div>
            )}
          </div>
        </div>

        {/* Chart 3: Sessions by Domain Distribution */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-2xs space-y-4">
          <div>
            <h3 className="text-base font-bold text-neutral-900 dark:text-white font-heading">
              Sessions by Domain
            </h3>
            <p className="text-xs text-neutral-500">Percentage distribution across tech domains</p>
          </div>

          <div className="h-64 w-full">
            {sessionsByTrackData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sessionsByTrackData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={45}
                    paddingAngle={3}
                  >
                    {sessionsByTrackData.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1E293B',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      color: '#FFF',
                      fontSize: '12px',
                    }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-neutral-400 italic">
                No track distribution available.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
