import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckSquare,
  Search,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Calendar,
  Clock,
  Filter,
} from 'lucide-react';
import { useAssignments, useStudents, useTracks } from '../db/hooks';
import { updateAssignmentStatusDB, deleteAssignmentDB } from '../db/operations';
import { useAppDispatch } from '../store';
import { openAddAssignmentModal, setDeletingAssignmentId } from '../store/uiSlice';
import { formatDateDisplay } from '../utils/dateTime';
import { AssignmentStatus } from '../types';
import { useToast } from '../components/Toast';
import { Pagination } from '../components/Pagination';
import { DOMAIN_OPTIONS, DOMAIN_COURSES, ALL_COURSES, DomainType, resolveDomainAndCourse, DOMAIN_THEMES } from '../utils/domainCourses';

export function AssignmentsPage() {
  const dispatch = useAppDispatch();
  const assignments = useAssignments();
  const students = useStudents();
  const tracks = useTracks();
  const { showToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedDomain, setSelectedDomain] = useState('all');
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Reset pagination to page 1 when search or any filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedStudent, selectedStatus, selectedDomain, selectedCourse]);

  const query = searchQuery.trim().toLowerCase();

  const availableCourses =
    selectedDomain !== 'all' && DOMAIN_COURSES[selectedDomain as DomainType]
      ? DOMAIN_COURSES[selectedDomain as DomainType]
      : ALL_COURSES;

  const filteredAssignments = assignments.filter((a) => {
    const { domain, course } = resolveDomainAndCourse(a.domain, a.course, a.trackId);

    if (query) {
      const taskMatch = a.taskTitle.toLowerCase().includes(query);
      const studentMatch = (a.studentName || '').toLowerCase().includes(query);
      const notesMatch = (a.notes || '').toLowerCase().includes(query);
      const domainMatch = domain.toLowerCase().includes(query);
      const courseMatch = course.toLowerCase().includes(query);
      if (!taskMatch && !studentMatch && !notesMatch && !domainMatch && !courseMatch) return false;
    }

    if (selectedStudent !== 'all' && a.studentId !== selectedStudent) return false;
    if (selectedStatus !== 'all' && a.status !== selectedStatus) return false;
    if (selectedDomain !== 'all' && domain !== selectedDomain) return false;
    if (selectedCourse !== 'all' && course !== selectedCourse) return false;

    return true;
  });

  const totalPages = Math.ceil(filteredAssignments.length / pageSize);
  const paginatedAssignments = filteredAssignments.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleStatusChange = async (id: string, status: AssignmentStatus) => {
    await updateAssignmentStatusDB(id, status);
    showToast(`Assignment status updated to ${status}`, 'info');
  };

  const handleDelete = (id: string) => {
    dispatch(setDeletingAssignmentId(id));
  };

  const statusColors: Record<AssignmentStatus, string> = {
    Assigned: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
    'In Progress': 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
    Submitted: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800',
    Reviewed: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800',
    Completed: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
    'Not Completed': 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
    Overdue: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-200 dark:border-rose-700',
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white font-heading tracking-tight">
            Assignments Management
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Track student tasks, homework, submission deadlines, and review status
          </p>
        </div>

        <button
          onClick={() => dispatch(openAddAssignmentModal(null))}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>+ Create Assignment</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-3.5 shadow-2xs flex flex-col lg:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full lg:w-80">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks or student names..."
            className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        {/* Dropdowns */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end text-xs">
          <select
            value={selectedStudent}
            onChange={(e) => setSelectedStudent(e.target.value)}
            className="px-2.5 py-1.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-800 dark:text-neutral-200"
          >
            <option value="all">All Students</option>
            {students.map((s) => (
              <option key={s.id} value={s.studentId}>
                {s.studentName}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-2.5 py-1.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-800 dark:text-neutral-200"
          >
            <option value="all">All Statuses</option>
            <option value="Assigned">Assigned</option>
            <option value="In Progress">In Progress</option>
            <option value="Submitted">Submitted</option>
            <option value="Reviewed">Reviewed</option>
            <option value="Completed">Completed</option>
            <option value="Overdue">Overdue</option>
          </select>

          <select
            value={selectedDomain}
            onChange={(e) => {
              setSelectedDomain(e.target.value);
              setSelectedCourse('all');
            }}
            aria-label="Filter by domain"
            className="px-2.5 py-1.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-800 dark:text-neutral-200"
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
            className="px-2.5 py-1.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-800 dark:text-neutral-200 max-w-[170px] truncate"
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

          <span className="text-neutral-500 font-medium pl-1">
            {filteredAssignments.length} tasks
          </span>
        </div>
      </div>

      {/* Assignments Table */}
      {filteredAssignments.length > 0 ? (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/80 dark:bg-neutral-800/50 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4 min-w-[220px]">Task / Assignment Title</th>
                  <th className="py-3 px-4">Domain & Course</th>
                  <th className="py-3 px-4">Assigned Date</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 text-xs sm:text-sm">
                {paginatedAssignments.map((assignment) => {
                  const { domain, course } = resolveDomainAndCourse(assignment.domain, assignment.course, assignment.trackId);
                  const themeColor = DOMAIN_THEMES[domain]?.primary || '#4F46E5';

                  return (
                    <tr key={assignment.id} className="hover:bg-neutral-50/80 dark:hover:bg-neutral-800/40 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap font-bold text-neutral-900 dark:text-white">
                        <Link to={`/students/${assignment.studentId}`} className="hover:underline hover:text-indigo-600">
                          {assignment.studentName}
                        </Link>
                      </td>

                      <td className="py-3 px-4 text-neutral-800 dark:text-neutral-200">
                        <div className="font-medium">{assignment.taskTitle}</div>
                        {assignment.notes && (
                          <div className="text-[11px] text-neutral-400 truncate max-w-xs">{assignment.notes}</div>
                        )}
                      </td>

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

                      <td className="py-3 px-4 whitespace-nowrap text-neutral-600 dark:text-neutral-400">
                        {formatDateDisplay(assignment.assignedDate)}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap text-neutral-600 dark:text-neutral-400 font-semibold">
                        {formatDateDisplay(assignment.dueDate)}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <select
                          value={assignment.status}
                          onChange={(e) => handleStatusChange(assignment.id, e.target.value as AssignmentStatus)}
                          className={`text-xs font-semibold px-2.5 py-1 rounded-full border cursor-pointer focus:outline-none ${
                            statusColors[assignment.status] || statusColors.Assigned
                          }`}
                        >
                          <option value="Assigned">Assigned</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Submitted">Submitted</option>
                          <option value="Reviewed">Reviewed</option>
                          <option value="Completed">Completed</option>
                          <option value="Not Completed">Not Completed</option>
                          <option value="Overdue">Overdue</option>
                        </select>
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {assignment.status !== 'Completed' && (
                            <button
                              type="button"
                              onClick={() => handleStatusChange(assignment.id, 'Completed')}
                              className="p-1.5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-md transition-colors"
                              title="Mark as Completed"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => dispatch(openAddAssignmentModal(assignment.id))}
                            className="p-1.5 text-neutral-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md transition-colors"
                            title="Edit Assignment"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(assignment.id)}
                            className="p-1.5 text-neutral-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-md transition-colors"
                            title="Delete Assignment"
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
            totalItems={filteredAssignments.length}
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
          <CheckSquare className="w-10 h-10 text-neutral-400 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-neutral-900 dark:text-white">
            No assignments found
          </h3>
          <p className="text-xs text-neutral-500 mt-1">
            Create an assignment for a student to track homework, projects, and due dates.
          </p>
          <div className="mt-5">
            <button
              onClick={() => dispatch(openAddAssignmentModal(null))}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold"
            >
              <Plus className="w-4 h-4" />
              <span>Create Assignment</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
