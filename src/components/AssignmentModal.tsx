import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X, CheckSquare, AlertCircle } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store';
import { closeAddAssignmentModal } from '../store/uiSlice';
import { addAssignmentDB, updateAssignmentDB } from '../db/operations';
import { useStudents, useTracks, useAssignments } from '../db/hooks';
import { Assignment, AssignmentStatus } from '../types';
import { useToast } from './Toast';

export function AssignmentModal() {
  const dispatch = useAppDispatch();
  const isOpen = useAppSelector((state) => state.ui.isAddAssignmentModalOpen);
  const editingAssignmentId = useAppSelector((state) => state.ui.editingAssignmentId);
  const students = useStudents();
  const tracks = useTracks();
  const assignments = useAssignments();
  const { showToast } = useToast();

  const editingAssignment = assignments.find((a) => a.id === editingAssignmentId) || null;

  const [studentId, setStudentId] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [trackId, setTrackId] = useState('');
  const [assignedDate, setAssignedDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState(new Date().toISOString().slice(0, 10));
  const [status, setStatus] = useState<AssignmentStatus>('Assigned');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    if (editingAssignment) {
      setStudentId(editingAssignment.studentId);
      setTaskTitle(editingAssignment.taskTitle);
      setTrackId(editingAssignment.trackId);
      setAssignedDate(editingAssignment.assignedDate);
      setDueDate(editingAssignment.dueDate);
      setStatus(editingAssignment.status);
      setNotes(editingAssignment.notes || '');
    } else {
      setStudentId(students[0]?.studentId || '');
      setTaskTitle('');
      setTrackId(tracks[0]?.id || '');
      setAssignedDate(new Date().toISOString().slice(0, 10));
      setDueDate(new Date().toISOString().slice(0, 10));
      setStatus('Assigned');
      setNotes('');
    }
    setError('');
  }, [isOpen, editingAssignment, students, tracks]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) {
      setError('Task / Assignment title is required');
      return;
    }
    if (!studentId) {
      setError('Please select a student');
      return;
    }

    const selectedStudent = students.find((s) => s.studentId === studentId);
    const studentName = selectedStudent ? selectedStudent.studentName : 'Student';

    try {
      if (editingAssignment) {
        const updated: Assignment = {
          ...editingAssignment,
          studentId,
          studentName,
          taskTitle: taskTitle.trim(),
          trackId,
          assignedDate,
          dueDate,
          status,
          notes: notes.trim(),
        };
        await updateAssignmentDB(updated);
        showToast(`Updated assignment for ${studentName}`, 'success');
      } else {
        await addAssignmentDB({
          studentId,
          studentName,
          taskTitle: taskTitle.trim(),
          trackId: trackId || tracks[0]?.id || 'track-full-stack',
          assignedDate,
          dueDate,
          status,
          notes: notes.trim(),
        });
        showToast(`Assigned task to ${studentName}`, 'success');
      }
      dispatch(closeAddAssignmentModal());
    } catch (err: any) {
      showToast(err.message || 'Failed to save assignment', 'error');
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => dispatch(closeAddAssignmentModal())}
          className="fixed inset-0 bg-neutral-900/50 dark:bg-black/75 backdrop-blur-xs"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.18 }}
          className="relative w-full max-w-lg bg-white dark:bg-neutral-900 rounded-xl shadow-2xl border border-neutral-200 dark:border-neutral-800 p-6 z-10 overflow-hidden"
        >
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                <CheckSquare className="w-4 h-4" />
              </span>
              <h3 className="text-base font-semibold text-neutral-900 dark:text-white">
                {editingAssignment ? 'Edit Assignment' : 'Create New Assignment'}
              </h3>
            </div>
            <button
              onClick={() => dispatch(closeAddAssignmentModal())}
              className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 p-1 rounded-md transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar px-1">
            {/* Student Select */}
            <div>
              <label htmlFor="assignment-student-select" className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1.5">
                Assign to Student <span className="text-rose-500">*</span>
              </label>
              <select
                id="assignment-student-select"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                {students.map((s) => (
                  <option key={s.id} value={s.studentId}>
                    {s.studentName} ({s.studentId})
                  </option>
                ))}
              </select>
            </div>

            {/* Task Title */}
            <div>
              <label htmlFor="assignment-task-title" className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1.5">
                Task / Assignment Title <span className="text-rose-500">*</span>
              </label>
              <textarea
                id="assignment-task-title"
                rows={2}
                value={taskTitle}
                onChange={(e) => {
                  setTaskTitle(e.target.value);
                  if (error) setError('');
                }}
                placeholder="e.g. Build a multi-AZ Terraform VPC module and deploy an NGINX ingress"
                className="w-full px-3 py-2 text-sm bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
              {error && (
                <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {error}
                </p>
              )}
            </div>

            {/* Track & Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="assignment-track-select" className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1.5">
                  Track
                </label>
                <select
                  id="assignment-track-select"
                  value={trackId}
                  onChange={(e) => setTrackId(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  {tracks.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="assignment-status-select" className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1.5">
                  Assignment Status
                </label>
                <select
                  id="assignment-status-select"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as AssignmentStatus)}
                  className="w-full px-3 py-2 text-sm bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  <option value="Assigned">Assigned</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Submitted">Submitted</option>
                  <option value="Reviewed">Reviewed</option>
                  <option value="Completed">Completed</option>
                  <option value="Not Completed">Not Completed</option>
                  <option value="Overdue">Overdue</option>
                </select>
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="assignment-assigned-date" className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1.5">
                  Assigned Date
                </label>
                <input
                  id="assignment-assigned-date"
                  type="date"
                  value={assignedDate}
                  onChange={(e) => setAssignedDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label htmlFor="assignment-due-date" className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1.5">
                  Due Date
                </label>
                <input
                  id="assignment-due-date"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="assignment-notes" className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1.5">
                Notes / Guidelines
              </label>
              <textarea
                id="assignment-notes"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Include reference links or review criteria..."
                className="w-full px-3 py-2 text-sm bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-neutral-100 dark:border-neutral-800">
              <button
                type="button"
                onClick={() => dispatch(closeAddAssignmentModal())}
                className="px-4 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg shadow-xs transition-colors"
              >
                {editingAssignment ? 'Save Changes' : 'Save Assignment'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
