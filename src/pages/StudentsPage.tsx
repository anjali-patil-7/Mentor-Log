import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Search,
  UserPlus,
  Edit2,
  Trash2,
  ExternalLink,
  BookOpen,
  Clock,
  CheckCircle,
  FileSpreadsheet,
  Plus,
} from 'lucide-react';
import { useStudents, useSessions } from '../db/hooks';
import { useAppDispatch } from '../store';
import { openAddStudentModal, setDeletingStudentId } from '../store/uiSlice';
import { formatDateDisplay, formatMentorHours } from '../utils/dateTime';
import { exportStudentsToExcel, exportStudentsToCsv } from '../utils/export';
import { deleteStudentDB } from '../db/operations';
import { useToast } from '../components/Toast';
import { Pagination } from '../components/Pagination';
import { DOMAIN_OPTIONS, DOMAIN_COURSES, ALL_COURSES, DomainType, resolveDomainAndCourse, DOMAIN_THEMES } from '../utils/domainCourses';

export function StudentsPage() {
  const dispatch = useAppDispatch();
  const students = useStudents();
  const sessions = useSessions();
  const { showToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('all');
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Reset pagination to page 1 when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedDomain, selectedCourse]);

  // Robust function to compute each student's stats
  const getStudentStats = (student: typeof students[0]) => {
    const matched = sessions.filter(
      (s) =>
        s.studentId === student.studentId ||
        s.studentId === student.id ||
        (student.studentName && s.studentName.toLowerCase() === student.studentName.toLowerCase())
    );
    const totalSessions = matched.length;
    const totalMinutes = matched.reduce((acc, s) => {
      const status = s.sessionStatus || s.classStatus || 'Completed';
      return acc + (status !== 'Cancelled' ? (s.durationMinutes || 0) : 0);
    }, 0);
    return {
      totalSessions,
      totalMinutes,
      formattedHours: formatMentorHours(totalMinutes),
    };
  };

  const availableCourses =
    selectedDomain !== 'all' && DOMAIN_COURSES[selectedDomain as DomainType]
      ? DOMAIN_COURSES[selectedDomain as DomainType]
      : ALL_COURSES;

  const query = searchQuery.trim().toLowerCase();
  const filteredStudents = students.filter((s) => {
    const { domain, course } = resolveDomainAndCourse(s.domain, s.course);

    if (query) {
      const nameMatch = s.studentName.toLowerCase().includes(query);
      const idMatch = s.studentId.toLowerCase().includes(query);
      const emailMatch = (s.email || '').toLowerCase().includes(query);
      const domainMatch = domain.toLowerCase().includes(query);
      const courseMatch = course.toLowerCase().includes(query);

      if (!nameMatch && !idMatch && !emailMatch && !domainMatch && !courseMatch) {
        return false;
      }
    }

    if (selectedDomain !== 'all' && domain !== selectedDomain) {
      return false;
    }

    if (selectedCourse !== 'all' && course !== selectedCourse) {
      return false;
    }

    return true;
  });

  const totalPages = Math.ceil(filteredStudents.length / pageSize);
  const paginatedStudents = filteredStudents.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const uniqueDomains = Array.from(new Set(students.map((s) => s.domain).filter(Boolean)));

  const handleExportExcel = () => {
    exportStudentsToExcel(filteredStudents);
    showToast(`Exported ${filteredStudents.length} students to Excel`, 'success');
  };

  const handleExportCsv = () => {
    exportStudentsToCsv(filteredStudents);
    showToast(`Exported ${filteredStudents.length} students to CSV`, 'success');
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete student record for ${name}?`)) {
      await deleteStudentDB(id);
      showToast(`Deleted student record for ${name}`, 'info');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white font-heading tracking-tight">
            Students Directory
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Manage student profiles, domain tracks, enrollment status, and session stats
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
            title="Export students to Excel"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">Export Excel</span>
          </button>

          <button
            onClick={() => dispatch(openAddStudentModal(null))}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white shadow-xs transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Add Student</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-3 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by student name, STU-001 ID, or email..."
            className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        {/* Domain & Course Select Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <select
            value={selectedDomain}
            onChange={(e) => {
              setSelectedDomain(e.target.value);
              setSelectedCourse('all');
            }}
            aria-label="Filter by domain"
            className="px-2.5 py-1.5 text-xs bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-800 dark:text-neutral-200 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="all">All Domains</option>
            {DOMAIN_OPTIONS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            aria-label="Filter by course"
            className="px-2.5 py-1.5 text-xs bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-800 dark:text-neutral-200 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 max-w-[170px] truncate"
          >
            <option value="all">
              {selectedDomain !== 'all' ? `All ${selectedDomain} Courses` : 'All Courses'}
            </option>
            {availableCourses.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <span className="text-xs text-neutral-500 font-medium whitespace-nowrap">
            Showing {filteredStudents.length} of {students.length}
          </span>
        </div>
      </div>

      {/* Students Data Table */}
      {filteredStudents.length > 0 ? (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/80 dark:bg-neutral-800/50 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                  <th className="py-3 px-4">Student ID</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Domain & Course</th>
                  <th className="py-3 px-4">Contact Info</th>
                  <th className="py-3 px-4">Joining Date</th>
                  <th className="py-3 px-4 text-center">Sessions</th>
                  <th className="py-3 px-4 text-center">Total Mentor Hours</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 text-xs sm:text-sm">
                {paginatedStudents.map((student) => {
                  const stats = getStudentStats(student);
                  const { domain, course } = resolveDomainAndCourse(student.domain, student.course);
                  const themeColor = DOMAIN_THEMES[domain]?.primary || '#4F46E5';

                  return (
                    <tr
                      key={student.id}
                      className="hover:bg-neutral-50/80 dark:hover:bg-neutral-800/40 transition-colors"
                    >
                      {/* ID Badge */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <Link
                          to={`/students/${student.studentId}`}
                          className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1"
                          title="View Student Profile"
                        >
                          <span>{student.studentId}</span>
                        </Link>
                      </td>

                      {/* Name */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <Link
                          to={`/students/${student.studentId}`}
                          className="font-bold text-neutral-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                        >
                          {student.studentName}
                        </Link>
                      </td>

                      {/* Domain & Course */}
                      <td className="py-3 px-4 whitespace-nowrap">
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
                            <span>{domain}</span>
                          </span>
                          {course && (
                            <span className="text-[11px] text-neutral-600 dark:text-neutral-400 font-medium truncate max-w-[160px]" title={course}>
                              {course}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="text-neutral-800 dark:text-neutral-200 font-medium">
                          {student.email || '—'}
                        </div>
                        <div className="text-[11px] text-neutral-400">{student.phone || '—'}</div>
                      </td>

                      {/* Date */}
                      <td className="py-3 px-4 whitespace-nowrap text-neutral-600 dark:text-neutral-400">
                        {formatDateDisplay(student.joiningDate)}
                      </td>

                      {/* Total Sessions */}
                      <td className="py-3 px-4 font-bold text-center text-neutral-900 dark:text-white">
                        {stats.totalSessions}
                      </td>

                      {/* Total Mentor Hours */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-mono font-bold text-xs"
                          title={`Total Mentor Hours: ${stats.formattedHours}`}
                        >
                          <Clock className="w-3 h-3 text-indigo-500" />
                          <span>{stats.formattedHours}</span>
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                            student.status === 'Active'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                              : 'bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400'
                          }`}
                        >
                          {student.status || 'Active'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            to={`/students/${student.studentId}`}
                            className="p-1.5 text-neutral-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md transition-colors"
                            title="View Student Profile"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>

                          <button
                            type="button"
                            onClick={() => dispatch(openAddStudentModal(student.studentId))}
                            className="p-1.5 text-neutral-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md transition-colors"
                            title="Edit Student Details"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(student.id, student.studentName)}
                            className="p-1.5 text-neutral-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-md transition-colors"
                            title="Delete Student"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
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
            totalItems={filteredStudents.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setCurrentPage(1);
            }}
          />
        </div>
      ) : (
        <div className="max-w-md mx-auto text-center p-8 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xs">
          <Users className="w-10 h-10 text-neutral-400 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-neutral-900 dark:text-white">
            No students found
          </h3>
          <p className="text-xs text-neutral-500 mt-1">
            Add your first student to start tracking individual mentoring history.
          </p>
          <div className="mt-5">
            <button
              onClick={() => dispatch(openAddStudentModal(null))}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add First Student</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
