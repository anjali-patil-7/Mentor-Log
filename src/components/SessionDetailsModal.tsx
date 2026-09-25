import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Calendar,
  Clock,
  User,
  BookOpen,
  Layers,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ExternalLink,
  Edit2,
  CopyPlus,
  Trash2,
  FileText,
  Video,
  Award,
  ListTodo,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store';
import { setViewingSessionId, openEditPanel, setDeletingSessionId } from '../store/uiSlice';
import { useSessions, useTracks, useStudents } from '../db/hooks';
import { duplicateSessionDB } from '../db/operations';
import { formatDateDisplay, formatTimeDisplay } from '../utils/dateTime';
import { useToast } from './Toast';

export function SessionDetailsModal() {
  const dispatch = useAppDispatch();
  const viewingSessionId = useAppSelector((state) => state.ui.viewingSessionId);
  const sessions = useSessions();
  const tracks = useTracks();
  const students = useStudents();
  const { showToast } = useToast();

  if (!viewingSessionId) return null;

  const session = sessions.find((s) => s.id === viewingSessionId);
  if (!session) return null;

  const track = tracks.find((t) => t.id === session.trackId);
  const student = students.find((st) => st.studentId === session.studentId);
  const domainName = track?.name || student?.domain || 'General';

  const handleClose = () => {
    dispatch(setViewingSessionId(null));
  };

  const handleEdit = () => {
    dispatch(openEditPanel(session.id));
    dispatch(setViewingSessionId(null));
  };

  const handleDuplicate = async () => {
    try {
      await duplicateSessionDB(session.id);
      showToast(`Duplicated session log for ${session.studentName}`, 'success');
      dispatch(setViewingSessionId(null));
    } catch {
      showToast('Failed to duplicate session', 'error');
    }
  };

  const handleDelete = () => {
    dispatch(setDeletingSessionId(session.id));
    dispatch(setViewingSessionId(null));
  };

  const statusColors: Record<string, string> = {
    Completed: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    Rescheduled: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    Cancelled: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800',
    Pending: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    Holiday: 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800',
  };

  const currentStatus = session.sessionStatus || session.classStatus || 'Completed';

  const resources = session.sessionResources?.length
    ? session.sessionResources
    : session.recordingClassLink
    ? [{ id: 'legacy', type: 'Recording' as const, title: 'Session Recording', url: session.recordingClassLink }]
    : [];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 sm:p-6">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 8 }}
          transition={{ duration: 0.15 }}
          className="relative w-full max-w-2xl bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden my-8"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/50 dark:bg-neutral-900/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-lg">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-neutral-900 dark:text-white font-heading">
                  Mentoring Session Details
                </h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {formatDateDisplay(session.date)} ({session.day})
                </p>
              </div>
            </div>

            <button
              onClick={handleClose}
              className="p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
            {/* Top Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Student */}
              <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-800">
                <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block mb-1">
                  Student
                </span>
                <span className="text-sm font-bold text-neutral-900 dark:text-white block truncate">
                  {session.studentName}
                </span>
                <span className="text-[11px] text-neutral-500">ID: {session.studentId}</span>
              </div>

              {/* Domain */}
              <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-800">
                <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block mb-1">
                  Domain / Track
                </span>
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-neutral-900 dark:text-white">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: track?.color || '#6366F1' }}
                  />
                  <span>{domainName}</span>
                </span>
              </div>

              {/* Status */}
              <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-800">
                <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block mb-1">
                  Session Status
                </span>
                <span
                  className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                    statusColors[currentStatus] || statusColors.Completed
                  }`}
                >
                  {currentStatus}
                </span>
              </div>
            </div>

            {/* Time & Attendance Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 text-xs">
              <div className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300">
                <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span className="font-semibold">
                  {formatTimeDisplay(session.startTime)} - {formatTimeDisplay(session.endTime)}
                </span>
                <span className="text-neutral-400">•</span>
                <span className="text-neutral-600 dark:text-neutral-400">{session.durationText}</span>
              </div>

              <div className="flex items-center gap-4">
                <div>
                  <span className="text-neutral-500 mr-1.5">Attendance:</span>
                  <span className="font-semibold text-neutral-900 dark:text-white">
                    {session.attendance}
                  </span>
                </div>
                {session.progressLevel && (
                  <div>
                    <span className="text-neutral-500 mr-1.5">Progress:</span>
                    <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                      {session.progressLevel}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Topics Covered */}
            <div className="space-y-1.5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                Topics Covered
              </h3>
              <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800 text-sm text-neutral-800 dark:text-neutral-200 leading-relaxed whitespace-pre-wrap">
                {session.topicsTaught || <span className="text-neutral-400 italic">No topics recorded</span>}
              </div>
            </div>

            {/* Upcoming Topics */}
            {session.upcomingTopics && (
              <div className="space-y-1.5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
                  <ListTodo className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  Planned for Next Session
                </h3>
                <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800 text-sm text-neutral-800 dark:text-neutral-200 leading-relaxed whitespace-pre-wrap">
                  {session.upcomingTopics}
                </div>
              </div>
            )}

            {/* Task Assignment */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  Task / Assignment
                </h3>
                {session.assignmentStatus && (
                  <span className="text-xs font-medium text-neutral-500">
                    Status: <span className="font-semibold text-neutral-800 dark:text-neutral-200">{session.assignmentStatus}</span>
                  </span>
                )}
              </div>
              <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800 text-sm text-neutral-800 dark:text-neutral-200 leading-relaxed whitespace-pre-wrap">
                {session.taskAssignment || <span className="text-neutral-400 italic">No assignment assigned</span>}
              </div>
            </div>

            {/* Resources & Links */}
            {resources.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
                  <Video className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  Session Resources ({resources.length})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {resources.map((res) => (
                    <a
                      key={res.id}
                      href={res.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-800 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors flex items-center justify-between group"
                    >
                      <div className="min-w-0 pr-2">
                        <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">
                          {res.type || 'Resource'}
                        </span>
                        <span className="text-xs font-semibold text-neutral-900 dark:text-white truncate block">
                          {res.title || res.url}
                        </span>
                      </div>
                      <ExternalLink className="w-4 h-4 text-neutral-400 group-hover:text-indigo-600 shrink-0 transition-colors" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Remarks / Notes */}
            {session.remarks && (
              <div className="space-y-1.5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  Mentor Remarks & Feedback
                </h3>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 italic bg-neutral-50 dark:bg-neutral-800/30 p-3 rounded-xl border border-neutral-200/60 dark:border-neutral-800">
                  "{session.remarks}"
                </p>
              </div>
            )}

            {/* Cancellation Reason */}
            {currentStatus === 'Cancelled' && session.cancellationReason && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-800 dark:text-rose-300">
                <span className="font-bold block mb-0.5">Cancellation Reason:</span>
                <span>{session.cancellationReason}</span>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleEdit}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit Session</span>
              </button>

              <button
                type="button"
                onClick={handleDuplicate}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 text-xs font-semibold transition-colors"
              >
                <CopyPlus className="w-3.5 h-3.5" />
                <span>Duplicate</span>
              </button>

              <button
                type="button"
                onClick={handleDelete}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-xs font-semibold transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 rounded-lg bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-semibold transition-colors"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
