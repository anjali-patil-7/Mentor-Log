import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import {
  ExternalLink,
  Edit2,
  Trash2,
  Clock,
  ChevronDown,
  CopyPlus,
  Video,
  Eye,
  MoreVertical,
  Plus,
  Link2,
} from 'lucide-react';
import { Session, Track, SessionStatus } from '../types';
import { formatDateDisplay, formatTimeDisplay } from '../utils/dateTime';
import { updateSessionStatusDB, duplicateSessionDB, removeSessionRecordingDB } from '../db/operations';
import { useAppDispatch } from '../store';
import { openEditPanel, setDeletingSessionId, setViewingSessionId } from '../store/uiSlice';
import { useToast } from './Toast';
import { RecordingLinkModal } from './RecordingLinkModal';
import { resolveDomainAndCourse, DOMAIN_THEMES } from '../utils/domainCourses';

interface SessionRowProps {
  key?: React.Key;
  session: Session;
  track?: Track;
}

export function SessionRow({ session, track }: SessionRowProps) {
  const dispatch = useAppDispatch();
  const { showToast } = useToast();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isRecordingModalOpen, setIsRecordingModalOpen] = useState(false);

  const recordingUrl =
    session.recordingClassLink?.trim() ||
    session.sessionResources?.find((r) => r.type === 'Recording')?.url?.trim() ||
    session.sessionResources?.[0]?.url?.trim() ||
    '';

  const { domain, course } = resolveDomainAndCourse(session.domain, session.course, session.trackId);
  const themeColor = DOMAIN_THEMES[domain]?.primary || track?.color || '#4F46E5';

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as SessionStatus;
    try {
      await updateSessionStatusDB(session.id, newStatus);
      showToast(`Status updated to ${newStatus}`, 'success');
    } catch {
      showToast('Failed to update status', 'error');
    }
  };

  const handleDuplicate = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await duplicateSessionDB(session.id);
      showToast('Session duplicated successfully', 'success');
    } catch {
      showToast('Failed to duplicate session', 'error');
    }
  };

  const handleOpenRecording = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    if (recordingUrl) {
      window.open(recordingUrl, '_blank', 'noopener,noreferrer');
    } else {
      showToast('No recording link available for this session', 'info');
    }
  };

  const handleRemoveRecording = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    try {
      await removeSessionRecordingDB(session.id);
      showToast('Recording link removed', 'info');
    } catch {
      showToast('Failed to remove recording link', 'error');
    }
  };

  return (
    <motion.tr
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.15 }}
      onClick={() => dispatch(openEditPanel(session.id))}
      className="group hover:bg-neutral-50/80 dark:hover:bg-neutral-800/40 border-b border-neutral-100 dark:border-neutral-800/80 cursor-pointer transition-colors text-xs sm:text-sm"
    >
      {/* Date & Day */}
      <td className="py-3 px-4 whitespace-nowrap">
        <div className="font-semibold text-neutral-900 dark:text-white">
          {formatDateDisplay(session.date)}
        </div>
        <div className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium">
          {session.day}
        </div>
      </td>

      {/* Student Name */}
      <td className="py-3 px-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
        <Link
          to={`/students/${session.studentId || session.studentName}`}
          className="font-bold text-neutral-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          title="View Student Profile"
        >
          {session.studentName}
        </Link>
        {session.studentId && (
          <div className="text-[10px] font-mono text-neutral-400">{session.studentId}</div>
        )}
      </td>

      {/* Domain & Course */}
      <td className="py-3 px-4 whitespace-nowrap">
        <div className="flex flex-col gap-1 items-start">
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-semibold border shadow-2xs"
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
            <span className="truncate max-w-[130px]">{domain}</span>
          </span>
          {course && (
            <span
              className="text-[11px] text-neutral-600 dark:text-neutral-400 font-medium truncate max-w-[170px]"
              title={course}
            >
              {course}
            </span>
          )}
        </div>
      </td>

      {/* Time & Duration */}
      <td className="py-3 px-4 whitespace-nowrap">
        <div className="font-mono text-xs text-neutral-700 dark:text-neutral-300">
          {formatTimeDisplay(session.startTime)} - {formatTimeDisplay(session.endTime)}
        </div>
        <div className="inline-flex items-center gap-1 text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 font-medium">
          <Clock className="w-3 h-3 text-neutral-400" />
          <span>{session.durationText}</span>
        </div>
      </td>

      {/* Class Status Dropdown */}
      <td className="py-3 px-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
        <div className="relative inline-block">
          <select
            value={session.sessionStatus || session.classStatus}
            onChange={handleStatusChange}
            aria-label={`Change status for session with ${session.studentName}`}
            className="appearance-none text-xs font-semibold pl-3 pr-6 py-1 rounded-full border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="Completed">Completed</option>
            <option value="Rescheduled">Rescheduled</option>
            <option value="Cancelled">Cancelled</option>
            <option value="Pending">Pending</option>
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-neutral-400 pointer-events-none" />
        </div>
      </td>

      {/* Attendance Badge */}
      <td className="py-3 px-4 whitespace-nowrap">
        <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
          {session.attendance || 'Present'}
        </span>
      </td>

      {/* Topics Taught */}
      <td className="py-3 px-4 min-w-[200px] max-w-[280px]">
        <div className="line-clamp-2 text-neutral-800 dark:text-neutral-200 text-xs leading-relaxed" title={session.topicsTaught}>
          {session.topicsTaught || <span className="text-neutral-400 italic">No notes</span>}
        </div>
      </td>

      {/* Task / Assignment */}
      <td className="py-3 px-4 min-w-[180px] max-w-[240px]">
        <div className="line-clamp-2 text-neutral-600 dark:text-neutral-400 text-xs" title={session.taskAssignment}>
          {session.taskAssignment || <span className="text-neutral-400 italic">—</span>}
        </div>
      </td>

      {/* Recording Link / Resources */}
      <td className="py-3 px-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
        {recordingUrl ? (
          <div className="flex items-center gap-1.5">
            <a
              href={recordingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors"
              title={recordingUrl}
            >
              <Video className="w-3.5 h-3.5" />
              <span>Recording</span>
              <ExternalLink className="w-3 h-3 opacity-60" />
            </a>
            {session.sessionResources && session.sessionResources.length > 1 && (
              <span
                className="text-[10px] font-semibold text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded-full"
                title={`${session.sessionResources.length} resources attached`}
              >
                +{session.sessionResources.length - 1}
              </span>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsRecordingModalOpen(true)}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-neutral-400 hover:text-indigo-600 dark:hover:text-indigo-400 py-1 transition-colors"
            title="Add recording link"
          >
            <Plus className="w-3 h-3" />
            <span>Add Link</span>
          </button>
        )}
      </td>

      {/* Actions (⋮ Actions Menu with Open Recording, Add/Edit Recording, View Details, Edit, Duplicate, Delete) */}
      <td className="py-3 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-end gap-1 relative">
          {/* Quick Edit */}
          <button
            type="button"
            onClick={() => dispatch(openEditPanel(session.id))}
            className="p-1.5 text-neutral-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md transition-colors"
            title="Edit Session"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>

          {/* Actions Dropdown Toggle Button (⋮) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsMenuOpen((prev) => !prev)}
              className="p-1.5 text-neutral-600 dark:text-neutral-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md transition-colors"
              title="Session Actions Menu"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {/* Dropdown Menu */}
            {isMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setIsMenuOpen(false)}
                />
                <div className="absolute right-0 top-full mt-1 z-30 w-52 bg-white dark:bg-neutral-800 rounded-xl shadow-xl border border-neutral-200 dark:border-neutral-700 py-1 text-xs text-left animate-in fade-in slide-in-from-top-1 duration-150">
                  {/* View Details */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      dispatch(setViewingSessionId(session.id));
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700/60 font-medium transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5 text-indigo-500" />
                    <span>View Details</span>
                  </button>

                  {/* Recording Link Options */}
                  {recordingUrl ? (
                    <>
                      {/* Open Recording */}
                      <button
                        type="button"
                        onClick={handleOpenRecording}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 font-medium transition-colors"
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>Open Recording</span>
                        <ExternalLink className="w-3 h-3 ml-auto opacity-70" />
                      </button>

                      {/* Edit Recording Link */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsMenuOpen(false);
                          setIsRecordingModalOpen(true);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700/60 font-medium transition-colors"
                      >
                        <Link2 className="w-3.5 h-3.5 text-blue-500" />
                        <span>Edit Recording Link</span>
                      </button>

                      {/* Remove Recording Link */}
                      <button
                        type="button"
                        onClick={handleRemoveRecording}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-medium transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove Recording Link</span>
                      </button>
                    </>
                  ) : (
                    /* Add Recording Link */
                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        setIsRecordingModalOpen(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 font-medium transition-colors"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>Add Recording Link</span>
                      <Plus className="w-3 h-3 ml-auto opacity-70" />
                    </button>
                  )}

                  <div className="my-1 border-t border-neutral-100 dark:border-neutral-700" />

                  {/* Edit Session */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      dispatch(openEditPanel(session.id));
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700/60 font-medium transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-blue-500" />
                    <span>Edit Session</span>
                  </button>

                  {/* Duplicate Session */}
                  <button
                    type="button"
                    onClick={(e) => {
                      setIsMenuOpen(false);
                      handleDuplicate(e);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700/60 font-medium transition-colors"
                  >
                    <CopyPlus className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Duplicate Session</span>
                  </button>

                  <div className="my-1 border-t border-neutral-100 dark:border-neutral-700" />

                  {/* Delete Session */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      dispatch(setDeletingSessionId(session.id));
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-medium transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Session</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Recording Link Modal */}
        <RecordingLinkModal
          isOpen={isRecordingModalOpen}
          onClose={() => setIsRecordingModalOpen(false)}
          session={session}
        />
      </td>
    </motion.tr>
  );
}
