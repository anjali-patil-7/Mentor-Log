import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  GraduationCap,
  Mail,
  Phone,
  Calendar,
  Layers,
  Clock,
  CheckCircle,
  CheckSquare,
  FileSpreadsheet,
  FileText,
  Edit2,
  BookOpen,
  TrendingUp,
  ArrowUpDown,
} from 'lucide-react';
import { useStudentById, useSessions, useAssignments, useTracks } from '../db/hooks';
import { useAppDispatch } from '../store';
import { openAddStudentModal, openAddPanel } from '../store/uiSlice';
import { formatDateDisplay, formatTimeDisplay, formatMentorHours } from '../utils/dateTime';
import { exportStudentPdfReport, exportSessionsToExcel, exportSessionsToCsv } from '../utils/export';
import { useToast } from '../components/Toast';
import { Pagination } from '../components/Pagination';

export function StudentProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { showToast } = useToast();

  const [sessionOrder, setSessionOrder] = useState<'latest' | 'oldest'>('latest');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const student = useStudentById(id || '');
  const allSessions = useSessions();
  const allAssignments = useAssignments();
  const tracks = useTracks();

  const trackMap = new Map(tracks.map((t) => [t.id, t]));

  // Filter sessions and assignments specifically for this student
  const studentSessions = allSessions.filter(
    (s) => s.studentId === id || (student && s.studentId === student.studentId) || (student && s.studentName === student.studentName)
  );

  const studentAssignments = allAssignments.filter(
    (a) => a.studentId === id || (student && a.studentId === student.studentId)
  );

  if (!student) {
    return (
      <div className="p-8 max-w-3xl mx-auto text-center space-y-4">
        <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Student Profile Not Found</h2>
        <p className="text-xs text-neutral-500">The requested student identifier ({id}) does not exist in the database.</p>
        <Link to="/students" className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-lg">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Students</span>
        </Link>
      </div>
    );
  }

  // Calculate student statistics
  const totalSessions = studentSessions.length;
  const totalMinutes = studentSessions.reduce(
    (acc, s) => acc + (s.sessionStatus !== 'Cancelled' && s.classStatus !== 'Cancelled' ? (s.durationMinutes || 0) : 0),
    0
  );
  const formattedMentorHours = formatMentorHours(totalMinutes);

  const presentCount = studentSessions.filter((s) => s.attendance === 'Present' || s.attendance === 'Late').length;
  const applicableSessions = studentSessions.filter((s) => s.attendance !== 'Not Applicable' && s.attendance !== 'Holiday').length;
  const attendanceRate = applicableSessions > 0 ? Math.round((presentCount / applicableSessions) * 100) : 100;

  const completedTasks = studentAssignments.filter((a) => a.status === 'Completed').length;
  const pendingTasks = studentAssignments.filter((a) => a.status !== 'Completed').length;

  const lastProgress = studentSessions.find((s) => s.progressLevel)?.progressLevel || 'Good';

  // Sort sessions: default latest/newest first
  const sortedSessions = [...studentSessions].sort((a, b) => {
    const dateA = a.date || '';
    const dateB = b.date || '';
    if (dateA !== dateB) {
      return sessionOrder === 'latest' ? dateB.localeCompare(dateA) : dateA.localeCompare(dateB);
    }
    return sessionOrder === 'latest'
      ? (b.startTime || '').localeCompare(a.startTime || '')
      : (a.startTime || '').localeCompare(b.startTime || '');
  });

  const totalPages = Math.ceil(sortedSessions.length / pageSize);
  const paginatedSessions = sortedSessions.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleExportPdf = () => {
    exportStudentPdfReport(student, studentSessions, tracks, `${student.studentId}-progress-report.pdf`);
    showToast(`Exported PDF Mentor Progress Report for ${student.studentName}`, 'success');
  };

  const handleExportExcel = () => {
    exportSessionsToExcel(studentSessions, tracks, `${student.studentId}-sessions.xlsx`);
    showToast(`Exported Excel session log for ${student.studentName}`, 'success');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Back Link */}
      <div>
        <Link
          to="/students"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Students Directory</span>
        </Link>
      </div>

      {/* Student Profile Card Header */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 shadow-2xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-100 dark:border-neutral-800 pb-5">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white font-bold text-xl flex items-center justify-center font-heading shadow-md shrink-0">
              {student.studentName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold text-neutral-900 dark:text-white font-heading">
                  {student.studentName}
                </h1>
                <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                  {student.studentId}
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800">
                  {student.status}
                </span>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                Domain Track: <strong className="text-neutral-800 dark:text-neutral-200">{student.domain}</strong> • Batch: {student.batch || '2026-B1'}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportPdf}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors"
            >
              <FileText className="w-4 h-4" />
              <span>Export PDF Report</span>
            </button>

            <button
              onClick={handleExportExcel}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Excel Log</span>
            </button>

            <button
              onClick={() => dispatch(openAddStudentModal(student.studentId))}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
            >
              <Edit2 className="w-4 h-4" />
              <span>Edit Info</span>
            </button>
          </div>
        </div>

        {/* Contact Info & Metadata Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-300">
            <Mail className="w-4 h-4 text-neutral-400" />
            <span>Email: <strong className="text-neutral-900 dark:text-white">{student.email || 'N/A'}</strong></span>
          </div>

          <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-300">
            <Phone className="w-4 h-4 text-neutral-400" />
            <span>Phone: <strong className="text-neutral-900 dark:text-white">{student.phone || 'N/A'}</strong></span>
          </div>

          <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-300">
            <Calendar className="w-4 h-4 text-neutral-400" />
            <span>Joined: <strong className="text-neutral-900 dark:text-white">{formatDateDisplay(student.joiningDate)}</strong></span>
          </div>
        </div>
      </div>

      {/* 6 Stats Overview Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4">
          <span className="text-[11px] font-semibold text-neutral-400 block">Total Sessions</span>
          <span className="text-2xl font-bold text-neutral-900 dark:text-white font-heading mt-1 block">
            {totalSessions}
          </span>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4">
          <span className="text-[11px] font-semibold text-neutral-400 block">Total Mentor Hours</span>
          <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 font-heading mt-1 block">
            {formattedMentorHours}
          </span>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4">
          <span className="text-[11px] font-semibold text-neutral-400 block">Attendance Rate</span>
          <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-heading mt-1 block">
            {attendanceRate}%
          </span>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4">
          <span className="text-[11px] font-semibold text-neutral-400 block">Completed Tasks</span>
          <span className="text-2xl font-bold text-neutral-900 dark:text-white font-heading mt-1 block">
            {completedTasks}
          </span>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4">
          <span className="text-[11px] font-semibold text-neutral-400 block">Pending Tasks</span>
          <span className="text-2xl font-bold text-amber-600 dark:text-amber-400 font-heading mt-1 block">
            {pendingTasks}
          </span>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4">
          <span className="text-[11px] font-semibold text-neutral-400 block">Current Progress</span>
          <span className="text-base font-bold text-purple-600 dark:text-purple-400 font-heading mt-2 block truncate">
            {lastProgress}
          </span>
        </div>
      </div>

      {/* Session History Table for Student */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-neutral-900 dark:text-white font-heading">
              Student Session History ({studentSessions.length})
            </h3>
            <p className="text-xs text-neutral-500">Complete log of classes, topics covered, and progress level</p>
          </div>

          {/* Session Order Filter Option (Latest -> Oldest / Oldest -> Latest) */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-500 font-medium whitespace-nowrap">Session Order:</span>
            <select
              value={sessionOrder}
              onChange={(e) => {
                setSessionOrder(e.target.value as 'latest' | 'oldest');
                setCurrentPage(1);
              }}
              className="px-3 py-1.5 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-800 dark:text-neutral-200 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="latest">Latest → Oldest</option>
              <option value="oldest">Oldest → Latest</option>
            </select>
          </div>
        </div>

        {paginatedSessions.length > 0 ? (
          <div>
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/80 dark:bg-neutral-800/50 font-semibold text-neutral-500">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Day</th>
                    <th className="py-2.5 px-3">Track</th>
                    <th className="py-2.5 px-3">Time</th>
                    <th className="py-2.5 px-3">Duration</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Attendance</th>
                    <th className="py-2.5 px-3 min-w-[200px]">Topics Covered</th>
                    <th className="py-2.5 px-3 min-w-[180px]">Assignment</th>
                    <th className="py-2.5 px-3">Progress</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {paginatedSessions.map((s) => {
                    const trackObj = trackMap.get(s.trackId);
                    const statusVal = s.sessionStatus || s.classStatus || 'Completed';
                    return (
                      <tr key={s.id} className="hover:bg-neutral-50/60 dark:hover:bg-neutral-800/40">
                        <td className="py-2.5 px-3 font-semibold text-neutral-900 dark:text-white whitespace-nowrap">
                          {formatDateDisplay(s.date)}
                        </td>
                        <td className="py-2.5 px-3 text-neutral-500 whitespace-nowrap">{s.day}</td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border"
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
                          {formatTimeDisplay(s.startTime)} - {formatTimeDisplay(s.endTime)}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-neutral-600 dark:text-neutral-400 whitespace-nowrap">
                          {s.durationText}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span className="font-semibold px-2 py-0.5 rounded-full text-[11px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800">
                            {statusVal}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap text-neutral-700 dark:text-neutral-300">
                          {s.attendance || 'Present'}
                        </td>
                        <td className="py-2.5 px-3 text-neutral-800 dark:text-neutral-200">
                          {s.topicsTaught || '—'}
                        </td>
                        <td className="py-2.5 px-3 text-neutral-600 dark:text-neutral-400">
                          {s.taskAssignment || '—'}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span className="font-semibold text-purple-600 dark:text-purple-400">
                            {s.progressLevel || 'Good'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={sortedSessions.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
            />
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-neutral-400 italic">
            No sessions logged for this student yet.
          </div>
        )}
      </div>
    </div>
  );
}
