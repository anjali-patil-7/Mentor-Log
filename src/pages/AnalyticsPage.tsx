import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
import {
  BarChart3,
  Clock,
  Users,
  Layers,
  TrendingUp,
  Calendar,
  BookOpen,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ExternalLink,
} from 'lucide-react';
import { useDashboardStats, useSessions, useStudents, useTracks, useFilteredSessions } from '../db/hooks';
import { useAppSelector } from '../store';
import { FilterBar } from '../components/FilterBar';
import { formatMentorHours } from '../utils/dateTime';
import { Pagination } from '../components/Pagination';
import { DOMAIN_OPTIONS, DomainType, resolveDomainAndCourse, DOMAIN_THEMES } from '../utils/domainCourses';

export function AnalyticsPage() {
  const stats = useDashboardStats();
  const allSessions = useSessions();
  const students = useStudents();
  const tracks = useTracks();

  const filters = useAppSelector((state) => state.filters);
  const { filteredSessions: sessions } = useFilteredSessions(filters);

  const [timeGroup, setTimeGroup] = useState<'day' | 'month'>('month');

  // Table pagination and filters for Student Performance
  const [tableSearch, setTableSearch] = useState('');
  const [tableDomain, setTableDomain] = useState('all');
  const [tableSortField, setTableSortField] = useState<'hours' | 'sessions' | 'attendance' | 'name'>('hours');
  const [tableSortAsc, setTableSortAsc] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [tableSearch, tableDomain, tableSortField, tableSortAsc]);

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

  // 3. Sessions by Domain Chart Data
  const domainCountMap: Record<DomainType, number> = {
    'Tech / IT': 0,
    'Management': 0,
    'Medical': 0,
  };
  sessions.forEach((s) => {
    const { domain } = resolveDomainAndCourse(s.domain, s.course, s.trackId);
    domainCountMap[domain] = (domainCountMap[domain] || 0) + 1;
  });

  const sessionsByTrackData = DOMAIN_OPTIONS.map((d) => ({
    name: d,
    value: domainCountMap[d] || 0,
    color: DOMAIN_THEMES[d].primary,
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

      {/* Table: Student Mentoring Performance & Hours Breakdown */}
      {(() => {
        const studentTableData = students
          .map((student) => {
            const studentSessions = allSessions.filter(
              (s) =>
                s.studentId === student.studentId ||
                s.studentId === student.id ||
                (student.studentName && s.studentName.toLowerCase() === student.studentName.toLowerCase())
            );

            const totalSessionsCount = studentSessions.length;
            const completedCount = studentSessions.filter(
              (s) => (s.sessionStatus || s.classStatus) === 'Completed'
            ).length;

            const totalMinutes = studentSessions.reduce(
              (sum, s) =>
                sum + ((s.sessionStatus || s.classStatus) !== 'Cancelled' ? s.durationMinutes || 0 : 0),
              0
            );

            const attended = studentSessions.filter(
              (s) => s.attendance === 'Present' || s.attendance === 'Late'
            ).length;
            const applicable = studentSessions.filter(
              (s) => s.attendance !== 'Not Applicable' && s.attendance !== 'Holiday'
            ).length;
            const attendancePct = applicable > 0 ? Math.round((attended / applicable) * 100) : 100;

            const { domain, course } = resolveDomainAndCourse(student.domain, student.course);

            return {
              id: student.id,
              studentId: student.studentId,
              studentName: student.studentName,
              domain,
              course,
              status: student.status,
              totalSessions: totalSessionsCount,
              completedCount,
              totalMinutes,
              formattedHours: formatMentorHours(totalMinutes),
              attendancePct,
            };
          })
          .filter((st) => {
            if (tableSearch.trim()) {
              const q = tableSearch.trim().toLowerCase();
              const matchName = st.studentName.toLowerCase().includes(q);
              const matchId = st.studentId.toLowerCase().includes(q);
              const matchCourse = st.course.toLowerCase().includes(q);
              if (!matchName && !matchId && !matchCourse) return false;
            }
            if (tableDomain !== 'all' && st.domain !== tableDomain) {
              return false;
            }
            return true;
          })
          .sort((a, b) => {
            let comp = 0;
            if (tableSortField === 'hours') {
              comp = a.totalMinutes - b.totalMinutes;
            } else if (tableSortField === 'sessions') {
              comp = a.totalSessions - b.totalSessions;
            } else if (tableSortField === 'attendance') {
              comp = a.attendancePct - b.attendancePct;
            } else {
              comp = a.studentName.localeCompare(b.studentName);
            }
            return tableSortAsc ? comp : -comp;
          });

        const totalPages = Math.ceil(studentTableData.length / pageSize);
        const paginatedData = studentTableData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

        const handleSort = (field: 'hours' | 'sessions' | 'attendance' | 'name') => {
          if (tableSortField === field) {
            setTableSortAsc(!tableSortAsc);
          } else {
            setTableSortField(field);
            setTableSortAsc(false);
          }
        };

        const renderSortIcon = (field: 'hours' | 'sessions' | 'attendance' | 'name') => {
          if (tableSortField !== field) {
            return <ArrowUpDown className="w-3 h-3 text-neutral-400 opacity-50" />;
          }
          return tableSortAsc ? (
            <ArrowUp className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          ) : (
            <ArrowDown className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          );
        };

        return (
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-neutral-900 dark:text-white font-heading">
                  Student Mentoring Performance & Hours Breakdown
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Detailed analytics of mentoring sessions, attendance rates, and total mentor hours
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative w-48 sm:w-56">
                  <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={tableSearch}
                    onChange={(e) => setTableSearch(e.target.value)}
                    placeholder="Search student or ID..."
                    className="w-full pl-8 pr-2.5 py-1 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <select
                  value={tableDomain}
                  onChange={(e) => setTableDomain(e.target.value)}
                  className="px-2.5 py-1 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-800 dark:text-neutral-200 focus:outline-none"
                >
                  <option value="all">All Domains</option>
                  {DOMAIN_OPTIONS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {studentTableData.length > 0 ? (
              <div className="border border-neutral-100 dark:border-neutral-800 rounded-lg overflow-hidden">
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/80 dark:bg-neutral-800/50 font-semibold text-neutral-500">
                        <th
                          onClick={() => handleSort('name')}
                          className="py-2.5 px-3 cursor-pointer hover:text-neutral-700 select-none whitespace-nowrap"
                        >
                          <div className="flex items-center gap-1.5">
                            <span>Student</span>
                            {renderSortIcon('name')}
                          </div>
                        </th>
                        <th className="py-2.5 px-3 whitespace-nowrap">Domain & Course</th>
                        <th
                          onClick={() => handleSort('sessions')}
                          className="py-2.5 px-3 text-center cursor-pointer hover:text-neutral-700 select-none whitespace-nowrap"
                        >
                          <div className="flex items-center justify-center gap-1.5">
                            <span>Total Sessions</span>
                            {renderSortIcon('sessions')}
                          </div>
                        </th>
                        <th className="py-2.5 px-3 text-center whitespace-nowrap">Completed</th>
                        <th
                          onClick={() => handleSort('hours')}
                          className="py-2.5 px-3 text-center cursor-pointer hover:text-neutral-700 select-none whitespace-nowrap"
                        >
                          <div className="flex items-center justify-center gap-1.5">
                            <span>Total Mentor Hours</span>
                            {renderSortIcon('hours')}
                          </div>
                        </th>
                        <th
                          onClick={() => handleSort('attendance')}
                          className="py-2.5 px-3 text-center cursor-pointer hover:text-neutral-700 select-none whitespace-nowrap"
                        >
                          <div className="flex items-center justify-center gap-1.5">
                            <span>Attendance</span>
                            {renderSortIcon('attendance')}
                          </div>
                        </th>
                        <th className="py-2.5 px-3 text-right whitespace-nowrap">Profile</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                      {paginatedData.map((st) => (
                        <tr key={st.id} className="hover:bg-neutral-50/60 dark:hover:bg-neutral-800/40">
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <Link
                              to={`/students/${st.studentId}`}
                              className="font-bold text-neutral-900 dark:text-white hover:text-indigo-600 transition-colors"
                            >
                              {st.studentName}
                            </Link>
                            <span className="text-[10px] text-neutral-400 block">{st.studentId}</span>
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            {(() => {
                              const themeColor = DOMAIN_THEMES[st.domain as DomainType]?.primary || '#4F46E5';
                              return (
                                <div className="flex flex-col gap-0.5 items-start">
                                  <span
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border"
                                    style={{
                                      backgroundColor: `${themeColor}15`,
                                      borderColor: `${themeColor}35`,
                                      color: themeColor,
                                    }}
                                  >
                                    <span
                                      className="w-1.5 h-1.5 rounded-full shrink-0"
                                      style={{ backgroundColor: themeColor }}
                                    />
                                    <span>{st.domain}</span>
                                  </span>
                                  {st.course && (
                                    <span className="text-[11px] text-neutral-600 dark:text-neutral-400 font-medium truncate max-w-[150px]" title={st.course}>
                                      {st.course}
                                    </span>
                                  )}
                                </div>
                              );
                            })()}
                          </td>
                          <td className="py-2.5 px-3 text-center font-bold text-neutral-900 dark:text-white whitespace-nowrap">
                            {st.totalSessions}
                          </td>
                          <td className="py-2.5 px-3 text-center text-emerald-600 font-semibold whitespace-nowrap">
                            {st.completedCount}
                          </td>
                          <td className="py-2.5 px-3 text-center whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-mono font-bold text-[11px]">
                              <Clock className="w-3 h-3 text-indigo-500" />
                              <span>{st.formattedHours}</span>
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center font-semibold whitespace-nowrap">
                            <span
                              className={
                                st.attendancePct >= 80
                                  ? 'text-emerald-600'
                                  : st.attendancePct >= 60
                                  ? 'text-amber-600'
                                  : 'text-rose-600'
                              }
                            >
                              {st.attendancePct}%
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right whitespace-nowrap">
                            <Link
                              to={`/students/${st.studentId}`}
                              className="p-1 inline-flex text-neutral-400 hover:text-indigo-600 transition-colors"
                              title="View details"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={studentTableData.length}
                  pageSize={pageSize}
                  onPageChange={setCurrentPage}
                  onPageSizeChange={(newSize) => {
                    setPageSize(newSize);
                    setCurrentPage(1);
                  }}
                />
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-neutral-400 italic">
                No students match your filter criteria.
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}
