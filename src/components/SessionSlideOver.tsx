import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Plus,
  Trash2,
  AlertCircle,
  Check,
  Copy,
  ExternalLink,
  RotateCcw,
  Link as LinkIcon,
  Video,
  Github,
  BookOpen,
  FileText,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store';
import { closePanel, openAddTrackModal, setDeletingSessionId, openAddStudentModal } from '../store/uiSlice';
import { addSessionDB, updateSessionDB } from '../db/operations';
import { useStudents, useTracks, useSessions } from '../db/hooks';
import {
  calculateDay,
  calculateDuration,
  getTodayString,
  formatTimeDisplay,
} from '../utils/dateTime';
import { SessionStatus, AttendanceStatus, ProgressLevel, CancellationReason, Session, SessionResource } from '../types';
import { useToast } from './Toast';
import { DOMAIN_OPTIONS, DOMAIN_COURSES, DomainType, resolveDomainAndCourse } from '../utils/domainCourses';

const DRAFT_STORAGE_KEY = 'mentor_log_session_draft_v2';

const RESOURCE_TYPES: SessionResource['type'][] = [
  'Recording',
  'Meeting Link',
  'GitHub',
  'Documentation',
  'Reference',
  'Other',
];

function resourceIcon(type: SessionResource['type']) {
  switch (type) {
    case 'Recording': return <Video className="w-3.5 h-3.5" />;
    case 'GitHub': return <Github className="w-3.5 h-3.5" />;
    case 'Documentation': return <BookOpen className="w-3.5 h-3.5" />;
    case 'Meeting Link': return <LinkIcon className="w-3.5 h-3.5" />;
    default: return <FileText className="w-3.5 h-3.5" />;
  }
}

function newResource(): SessionResource {
  return {
    id: `res-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    type: 'Recording',
    title: '',
    url: '',
  };
}

export function SessionSlideOver() {
  const dispatch = useAppDispatch();
  const isOpen = useAppSelector((state) => state.ui.isPanelOpen);
  const editingSessionId = useAppSelector((state) => state.ui.editingSessionId);
  const duplicatingSessionId = useAppSelector((state) => state.ui.duplicatingSessionId);

  const students = useStudents();
  const tracks = useTracks();
  const sessions = useSessions();
  const { showToast } = useToast();

  const editingSession = sessions.find((s) => s.id === editingSessionId) || null;
  const duplicatingSession = sessions.find((s) => s.id === duplicatingSessionId) || null;

  // Form states
  const [studentId, setStudentId] = useState('');
  const [studentName, setStudentName] = useState('');
  const [domain, setDomain] = useState<DomainType>('Tech / IT');
  const [course, setCourse] = useState<string>('Full Stack Software Development');
  const [trackId, setTrackId] = useState('Full Stack Software Development');
  const [date, setDate] = useState(getTodayString());
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('11:30');
  const [topicsTaught, setTopicsTaught] = useState('');
  const [upcomingTopics, setUpcomingTopics] = useState('');
  const [taskAssignment, setTaskAssignment] = useState('');
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>('Completed');
  const [attendance, setAttendance] = useState<AttendanceStatus>('Present');
  const [cancellationReason, setCancellationReason] = useState<CancellationReason>('Student unavailable');
  const [customReason, setCustomReason] = useState('');
  const [progressLevel, setProgressLevel] = useState<ProgressLevel>('Good');
  const [recordingLink, setRecordingLink] = useState('');
  const [sessionResources, setSessionResources] = useState<SessionResource[]>([]);
  const [remarks, setRemarks] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hasDraft, setHasDraft] = useState(false);

  // Auto-populate when modal opens or editing session changes
  useEffect(() => {
    if (!isOpen) return;

    const sourceSession = editingSession || duplicatingSession;

    if (sourceSession) {
      setStudentId(sourceSession.studentId || (students[0]?.studentId || ''));
      setStudentName(sourceSession.studentName || '');
      const resolved = resolveDomainAndCourse(sourceSession.domain, sourceSession.course, sourceSession.trackId);
      setDomain(resolved.domain);
      setCourse(resolved.course);
      setTrackId(resolved.course || sourceSession.trackId || '');
      setDate(duplicatingSession ? getTodayString() : sourceSession.date);
      setStartTime(sourceSession.startTime || '10:00');
      setEndTime(sourceSession.endTime || '11:30');
      setTopicsTaught(sourceSession.topicsTaught || '');
      setUpcomingTopics(sourceSession.upcomingTopics || '');
      setTaskAssignment(sourceSession.taskAssignment || '');
      // Safe read: prefer sessionStatus, fall back to classStatus
      const status = sourceSession.sessionStatus || (sourceSession as any).classStatus || 'Completed';
      setSessionStatus(duplicatingSession ? 'Completed' : status as SessionStatus);
      setAttendance(sourceSession.attendance || 'Present');
      setCancellationReason((sourceSession.cancellationReason as any) || 'Student unavailable');
      setCustomReason('');
      setProgressLevel(sourceSession.progressLevel || 'Good');

      const recUrl =
        sourceSession.recordingClassLink ||
        sourceSession.sessionResources?.find((r) => r.type === 'Recording')?.url ||
        '';
      setRecordingLink(recUrl);

      // Migrate old recordingClassLink to resources if needed
      let resources = Array.isArray(sourceSession.sessionResources) ? [...sourceSession.sessionResources] : [];
      if (resources.length === 0 && (sourceSession as any).recordingClassLink) {
        resources = [{
          id: `res-${Date.now()}`,
          type: 'Recording',
          title: 'Session Recording',
          url: (sourceSession as any).recordingClassLink,
        }];
      }
      setSessionResources(resources);
      setRemarks(sourceSession.remarks || '');
    } else {
      // Check for saved draft
      const draftRaw = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (draftRaw) {
        try {
          const draft = JSON.parse(draftRaw);
          setStudentId(draft.studentId || (students[0]?.studentId || ''));
          setStudentName(draft.studentName || '');
          const resolved = resolveDomainAndCourse(draft.domain, draft.course, draft.trackId);
          setDomain(resolved.domain);
          setCourse(resolved.course);
          setTrackId(resolved.course || draft.trackId || '');
          setDate(draft.date || getTodayString());
          setStartTime(draft.startTime || '10:00');
          setEndTime(draft.endTime || '11:30');
          setTopicsTaught(draft.topicsTaught || '');
          setUpcomingTopics(draft.upcomingTopics || '');
          setTaskAssignment(draft.taskAssignment || '');
          setSessionStatus(draft.sessionStatus || 'Completed');
          setAttendance(draft.attendance || 'Present');
          setCancellationReason(draft.cancellationReason || 'Student unavailable');
          setCustomReason(draft.customReason || '');
          setProgressLevel(draft.progressLevel || 'Good');
          setRecordingLink(draft.recordingLink || draft.recordingClassLink || '');
          setSessionResources(draft.sessionResources || []);
          setRemarks(draft.remarks || '');
          setHasDraft(true);
        } catch {
          resetForm();
        }
      } else {
        resetForm();
      }
    }
    setErrors({});
  }, [isOpen, editingSession, duplicatingSession, students, tracks]);

  // Draft Auto-Save (debounced)
  useEffect(() => {
    if (!isOpen || editingSession) return;
    const timer = setTimeout(() => {
      if (topicsTaught.trim() || studentId || taskAssignment.trim() || recordingLink.trim()) {
        const draft = {
          studentId, studentName, domain, course, trackId, date, startTime, endTime,
          topicsTaught, upcomingTopics, taskAssignment, sessionStatus,
          attendance, cancellationReason, customReason, progressLevel,
          recordingLink, sessionResources, remarks,
        };
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [isOpen, editingSession, studentId, studentName, domain, course, trackId, date, startTime, endTime,
      topicsTaught, upcomingTopics, taskAssignment, sessionStatus, attendance,
      cancellationReason, customReason, progressLevel, recordingLink, sessionResources, remarks]);

  const resetForm = () => {
    const firstStu = students[0];
    setStudentId(firstStu?.studentId || '');
    setStudentName(firstStu?.studentName || '');
    const resolved = resolveDomainAndCourse(firstStu?.domain, firstStu?.course);
    setDomain(resolved.domain);
    setCourse(resolved.course);
    setTrackId(resolved.course || tracks[0]?.id || '');
    setDate(getTodayString());
    setStartTime('10:00');
    setEndTime('11:30');
    setTopicsTaught('');
    setUpcomingTopics('');
    setTaskAssignment('');
    setSessionStatus('Completed');
    setAttendance('Present');
    setCancellationReason('Student unavailable');
    setCustomReason('');
    setProgressLevel('Good');
    setRecordingLink('');
    setSessionResources([]);
    setRemarks('');
    setHasDraft(false);
  };

  const handleDiscardDraft = () => {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    resetForm();
    showToast('Draft discarded', 'info');
  };

  const handleStudentSelect = (selectedId: string) => {
    setStudentId(selectedId);
    const selected = students.find((s) => s.studentId === selectedId);
    if (selected) {
      setStudentName(selected.studentName);
      const resolved = resolveDomainAndCourse(selected.domain, selected.course);
      setDomain(resolved.domain);
      setCourse(resolved.course);
      setTrackId(resolved.course);
    }
  };

  const handleDomainChange = (newDomain: DomainType) => {
    setDomain(newDomain);
    const firstCourse = DOMAIN_COURSES[newDomain][0] || '';
    setCourse(firstCourse);
    setTrackId(firstCourse);
  };

  const handleCourseChange = (newCourse: string) => {
    setCourse(newCourse);
    setTrackId(newCourse);
  };

  // Session Resources handlers
  const addResource = () => {
    setSessionResources((prev) => [...prev, newResource()]);
  };

  const updateResource = (idx: number, updates: Partial<SessionResource>) => {
    setSessionResources((prev) => prev.map((r, i) => i === idx ? { ...r, ...updates } : r));
  };

  const removeResource = (idx: number) => {
    setSessionResources((prev) => prev.filter((_, i) => i !== idx));
  };

  // Auto-calculated values
  const day = calculateDay(date);
  const { minutes: durationMinutes, text: durationText } = calculateDuration(startTime, endTime);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!studentId && !studentName.trim()) {
      newErrors.studentId = 'Student selection is required';
    }
    if (!trackId) {
      newErrors.trackId = 'Domain is required';
    }
    if (!date) {
      newErrors.date = 'Date is required';
    }
    if (!startTime) {
      newErrors.startTime = 'Start time is required';
    }
    if (!endTime) {
      newErrors.endTime = 'End time is required';
    }
    if (durationMinutes <= 0) {
      newErrors.endTime = 'End time must be later than start time';
    }
    if (!topicsTaught.trim()) {
      newErrors.topicsTaught = 'Please describe the topics covered in this session';
    }
    if (recordingLink.trim() && !recordingLink.trim().match(/^https?:\/\/.+/i)) {
      newErrors.recordingLink = 'Enter a valid URL (starting with http:// or https://)';
    }
    // Validate resource URLs
    sessionResources.forEach((r, idx) => {
      if (r.url.trim() && !r.url.match(/^https?:\/\/.+/i)) {
        newErrors[`resource_url_${idx}`] = 'Enter a valid URL (http:// or https://)';
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const finalReason = cancellationReason === 'Other' ? customReason.trim() : cancellationReason;
    const trimmedRecording = recordingLink.trim();
    let cleanResources = sessionResources.filter((r) => r.url.trim());

    if (trimmedRecording) {
      const existingRecIdx = cleanResources.findIndex((r) => r.type === 'Recording');
      if (existingRecIdx >= 0) {
        cleanResources[existingRecIdx] = {
          ...cleanResources[existingRecIdx],
          url: trimmedRecording,
          title: cleanResources[existingRecIdx].title || 'Session Recording',
        };
      } else {
        cleanResources.unshift({
          id: `res-${Date.now()}`,
          type: 'Recording',
          title: 'Session Recording',
          url: trimmedRecording,
        });
      }
    } else {
      cleanResources = cleanResources.filter((r) => r.type !== 'Recording');
    }

    try {
      if (editingSession) {
        const updated: Session = {
          ...editingSession,
          studentId,
          studentName,
          domain,
          course,
          trackId: course || trackId,
          date,
          day,
          startTime,
          endTime,
          durationMinutes,
          durationText,
          sessionStatus,
          attendance,
          topicsTaught: topicsTaught.trim(),
          upcomingTopics: upcomingTopics.trim(),
          taskAssignment: taskAssignment.trim(),
          assignmentStatus: taskAssignment.trim() ? 'Assigned' : 'Completed',
          sessionResources: cleanResources,
          recordingClassLink: trimmedRecording,
          progressLevel,
          remarks: remarks.trim(),
          cancellationReason: sessionStatus === 'Cancelled' ? finalReason : '',
          updatedAt: new Date().toISOString(),
        };
        await updateSessionDB(updated);
        showToast(`Updated session for ${studentName}`, 'success');
      } else {
        await addSessionDB({
          studentId,
          studentName,
          domain,
          course,
          trackId: course || trackId,
          date,
          startTime,
          endTime,
          sessionStatus,
          attendance,
          topicsTaught: topicsTaught.trim(),
          upcomingTopics: upcomingTopics.trim(),
          taskAssignment: taskAssignment.trim(),
          assignmentStatus: taskAssignment.trim() ? 'Assigned' : 'Completed',
          sessionResources: cleanResources,
          recordingClassLink: trimmedRecording,
          progressLevel,
          remarks: remarks.trim(),
          cancellationReason: sessionStatus === 'Cancelled' ? finalReason : '',
        });
        showToast(`Logged session for ${studentName}`, 'success');
      }

      localStorage.removeItem(DRAFT_STORAGE_KEY);
      dispatch(closePanel());
    } catch (err: any) {
      showToast(err.message || 'Failed to save session', 'error');
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-40 overflow-hidden">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => dispatch(closePanel())}
          className="fixed inset-0 bg-neutral-900/40 dark:bg-black/60 backdrop-blur-xs transition-opacity"
        />

        {/* Slide-over Drawer */}
        <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="w-screen max-w-xl bg-white dark:bg-neutral-900 shadow-2xl border-l border-neutral-200 dark:border-neutral-800 flex flex-col h-full"
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/60 dark:bg-neutral-900/80">
              <div>
                <h2 className="text-lg font-bold text-neutral-900 dark:text-white font-heading">
                  {editingSession ? 'Edit Session' : duplicatingSession ? 'Duplicate Session' : '+ Log Session'}
                </h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Record attendance, topics, resources, and assignments
                </p>
              </div>
              <button
                onClick={() => dispatch(closePanel())}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                aria-label="Close panel"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Unsaved Draft Banner */}
            {hasDraft && !editingSession && (
              <div className="px-6 py-2 bg-indigo-50 dark:bg-indigo-950/60 border-b border-indigo-100 dark:border-indigo-900 flex items-center justify-between text-xs text-indigo-700 dark:text-indigo-300">
                <span>Unsaved draft restored</span>
                <button onClick={handleDiscardDraft} className="font-semibold underline flex items-center gap-1">
                  <RotateCcw className="w-3 h-3" />
                  Discard Draft
                </button>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">

              {/* Row 1: Student */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="slide-student-select" className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
                    Student <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => dispatch(openAddStudentModal(null))}
                    className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
                  >
                    <Plus className="w-3 h-3" />
                    Add Student
                  </button>
                </div>
                <select
                  id="slide-student-select"
                  value={studentId}
                  onChange={(e) => handleStudentSelect(e.target.value)}
                  className={`w-full px-3 py-2 text-sm bg-neutral-50 dark:bg-neutral-800/80 border rounded-lg text-neutral-900 dark:text-white focus:outline-none focus:ring-2 ${
                    errors.studentId
                      ? 'border-rose-300 focus:ring-rose-500/20'
                      : 'border-neutral-200 dark:border-neutral-700 focus:ring-indigo-500/20'
                  }`}
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.studentId}>
                      {s.studentName} ({s.studentId})
                    </option>
                  ))}
                </select>
                {errors.studentId && (
                  <p className="text-xs text-rose-500 mt-1">{errors.studentId}</p>
                )}
              </div>

              {/* Row 2: Domain (Parent) & Course (Child) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="slide-domain-select" className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1.5">
                    Domain (Parent) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    id="slide-domain-select"
                    value={domain}
                    onChange={(e) => handleDomainChange(e.target.value as DomainType)}
                    className="w-full px-3 py-2 text-sm bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    {DOMAIN_OPTIONS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="slide-course-select" className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1.5">
                    Course (Child) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    id="slide-course-select"
                    value={course}
                    onChange={(e) => handleCourseChange(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    {(DOMAIN_COURSES[domain] || []).map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 2: Date & Auto Day */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="slide-session-date" className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1.5">
                    Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="slide-session-date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div>
                  <span className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1.5">
                    Day <span className="text-[10px] text-neutral-400 normal-case">(auto)</span>
                  </span>
                  <div className="px-3.5 py-2 text-sm bg-neutral-100 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-700 dark:text-neutral-300 font-medium">
                    {day || '—'}
                  </div>
                </div>
              </div>

              {/* Row 3: Start Time, End Time, Auto Duration */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label htmlFor="slide-start-time" className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1.5">
                    Start Time <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="slide-start-time"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-2.5 py-2 text-sm bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div>
                  <label htmlFor="slide-end-time" className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1.5">
                    End Time <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="slide-end-time"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-2.5 py-2 text-sm bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div>
                  <span className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1.5">
                    Duration <span className="text-[10px] text-neutral-400 normal-case">(auto)</span>
                  </span>
                  <div className={`px-2.5 py-2 text-sm rounded-lg font-semibold text-center ${
                    durationMinutes > 0
                      ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300'
                      : 'bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400'
                  }`}>
                    {durationMinutes > 0 ? durationText : '—'}
                  </div>
                </div>
              </div>
              {errors.endTime && (
                <p className="text-xs text-rose-500 flex items-center gap-1 -mt-3">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.endTime}
                </p>
              )}

              {/* Row 4: Session Status & Attendance */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="slide-session-status" className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1.5">
                    Session Status <span className="text-rose-500">*</span>
                  </label>
                  <select
                    id="slide-session-status"
                    value={sessionStatus}
                    onChange={(e) => setSessionStatus(e.target.value as SessionStatus)}
                    className="w-full px-3 py-2 text-sm bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="Completed">Completed</option>
                    <option value="Rescheduled">Rescheduled</option>
                    <option value="Cancelled">Cancelled</option>
                    <option value="Pending">Pending</option>
                    <option value="Holiday">Holiday</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="slide-attendance" className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1.5">
                    Attendance <span className="text-rose-500">*</span>
                  </label>
                  <select
                    id="slide-attendance"
                    value={attendance}
                    onChange={(e) => setAttendance(e.target.value as AttendanceStatus)}
                    className="w-full px-3 py-2 text-sm bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="Present">Present</option>
                    <option value="Absent">Absent</option>
                    <option value="Late">Late</option>
                    <option value="Excused">Excused</option>
                    <option value="Holiday">Holiday</option>
                    <option value="Not Applicable">Not Applicable</option>
                  </select>
                </div>
              </div>

              {/* Conditional Cancellation Reason */}
              {sessionStatus === 'Cancelled' && (
                <div className="p-3 bg-rose-50/50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-lg space-y-3">
                  <div>
                    <label htmlFor="slide-cancellation-reason" className="block text-xs font-semibold uppercase tracking-wider text-rose-700 dark:text-rose-300 mb-1.5">
                      Cancellation Reason <span className="text-rose-500">*</span>
                    </label>
                    <select
                      id="slide-cancellation-reason"
                      value={cancellationReason}
                      onChange={(e) => setCancellationReason(e.target.value as CancellationReason)}
                      className="w-full px-3 py-2 text-sm bg-white dark:bg-neutral-800 border border-rose-300 dark:border-rose-800 rounded-lg text-neutral-900 dark:text-white"
                    >
                      <option value="Student unavailable">Student unavailable</option>
                      <option value="Mentor unavailable">Mentor unavailable</option>
                      <option value="Technical issue">Technical issue</option>
                      <option value="Holiday">Holiday</option>
                      <option value="Schedule conflict">Schedule conflict</option>
                      <option value="Personal reason">Personal reason</option>
                      <option value="Other">Other...</option>
                    </select>
                  </div>

                  {cancellationReason === 'Other' && (
                    <input
                      type="text"
                      value={customReason}
                      onChange={(e) => setCustomReason(e.target.value)}
                      placeholder="Specify cancellation reason..."
                      className="w-full px-3 py-1.5 text-xs bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-md text-neutral-900 dark:text-white"
                    />
                  )}
                </div>
              )}

              {/* Progress Level */}
              <div>
                <label htmlFor="slide-progress-level" className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1.5">
                  Student Progress Level
                </label>
                <select
                  id="slide-progress-level"
                  value={progressLevel}
                  onChange={(e) => setProgressLevel(e.target.value as ProgressLevel)}
                  className="w-full px-3 py-2 text-sm bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="Needs Improvement">Needs Improvement</option>
                  <option value="Beginner">Beginner</option>
                  <option value="Developing">Developing</option>
                  <option value="Good">Good</option>
                  <option value="Strong">Strong</option>
                </select>
              </div>

              {/* Topics Taught */}
              <div>
                <label htmlFor="slide-topics-taught" className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1.5">
                  Topics Taught <span className="text-rose-500">*</span>
                </label>
                <textarea
                  id="slide-topics-taught"
                  rows={3}
                  value={topicsTaught}
                  onChange={(e) => {
                    setTopicsTaught(e.target.value);
                    if (errors.topicsTaught) setErrors((prev) => ({ ...prev, topicsTaught: '' }));
                  }}
                  placeholder="e.g. AWS VPC, Subnets, Route Tables, Transit Gateways..."
                  className={`w-full px-3 py-2 text-sm bg-neutral-50 dark:bg-neutral-800/80 border rounded-lg text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 ${
                    errors.topicsTaught
                      ? 'border-rose-300 focus:ring-rose-500/20'
                      : 'border-neutral-200 dark:border-neutral-700 focus:ring-indigo-500/20'
                  }`}
                />
                {errors.topicsTaught && (
                  <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.topicsTaught}
                  </p>
                )}
              </div>

              {/* Upcoming Topics */}
              <div>
                <label htmlFor="slide-upcoming-topics" className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1.5">
                  Upcoming Topics
                  <span className="ml-1.5 text-[10px] font-normal text-neutral-400 normal-case">(for next session)</span>
                </label>
                <textarea
                  id="slide-upcoming-topics"
                  rows={2}
                  value={upcomingTopics}
                  onChange={(e) => setUpcomingTopics(e.target.value)}
                  placeholder="e.g. NAT Gateway, Load Balancer, Auto Scaling..."
                  className="w-full px-3 py-2 text-sm bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              {/* Task / Assignment */}
              <div>
                <label htmlFor="slide-task-assignment" className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1.5">
                  Task / Assignment Given
                </label>
                <textarea
                  id="slide-task-assignment"
                  rows={2}
                  value={taskAssignment}
                  onChange={(e) => setTaskAssignment(e.target.value)}
                  placeholder="e.g. Deploy a multi-AZ VPC terraform template..."
                  className="w-full px-3 py-2 text-sm bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              {/* Session Recording Link */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="slide-recording-link" className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
                    Session Recording Link
                  </label>
                  {recordingLink && (
                    <a
                      href={recordingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Test Link
                    </a>
                  )}
                </div>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">
                    <Video className="w-4 h-4" />
                  </div>
                  <input
                    id="slide-recording-link"
                    type="url"
                    value={recordingLink}
                    onChange={(e) => {
                      setRecordingLink(e.target.value);
                      if (errors.recordingLink) setErrors((prev) => ({ ...prev, recordingLink: '' }));
                    }}
                    placeholder="https://meet.google.com/... or Zoom, Loom, YouTube, Drive"
                    className={`w-full pl-9 pr-8 py-2 text-sm bg-neutral-50 dark:bg-neutral-800/80 border rounded-lg text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 ${
                      errors.recordingLink
                        ? 'border-rose-300 focus:ring-rose-500/20'
                        : 'border-neutral-200 dark:border-neutral-700 focus:ring-indigo-500/20'
                    }`}
                  />
                  {recordingLink && (
                    <button
                      type="button"
                      onClick={() => setRecordingLink('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-rose-500 transition-colors"
                      title="Remove recording link"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                {errors.recordingLink ? (
                  <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.recordingLink}
                  </p>
                ) : (
                  <p className="text-[11px] text-neutral-400 mt-1">
                    Add or paste a video recording link (Google Meet, Loom, Zoom, YouTube, Drive).
                  </p>
                )}
              </div>

              {/* Session Resources */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
                    Session Resources
                  </label>
                  <button
                    type="button"
                    onClick={addResource}
                    className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
                  >
                    <Plus className="w-3 h-3" />
                    Add Resource
                  </button>
                </div>

                {sessionResources.length === 0 ? (
                  <div className="text-xs text-neutral-400 italic py-1">
                    No resources added. Click "+ Add Resource" to attach recordings, links, or docs.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {sessionResources.map((resource, idx) => (
                      <div key={resource.id} className="p-3 bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-lg space-y-2">
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="block text-[10px] font-semibold text-neutral-500 mb-1">Type</label>
                            <select
                              value={resource.type}
                              onChange={(e) => updateResource(idx, { type: e.target.value as SessionResource['type'] })}
                              className="w-full px-2 py-1.5 text-xs bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded text-neutral-900 dark:text-white"
                            >
                              {RESOURCE_TYPES.map((t) => (
                                <option key={t} value={t}>{t}</option>
                              ))}
                            </select>
                          </div>
                          <div className="col-span-2">
                            <label className="block text-[10px] font-semibold text-neutral-500 mb-1">Title</label>
                            <input
                              type="text"
                              value={resource.title}
                              onChange={(e) => updateResource(idx, { title: e.target.value })}
                              placeholder="e.g. Session Recording"
                              className="w-full px-2 py-1.5 text-xs bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded text-neutral-900 dark:text-white placeholder-neutral-400"
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <label className="block text-[10px] font-semibold text-neutral-500 mb-1">URL</label>
                            <input
                              type="url"
                              value={resource.url}
                              onChange={(e) => updateResource(idx, { url: e.target.value })}
                              placeholder="https://..."
                              className={`w-full px-2 py-1.5 text-xs bg-white dark:bg-neutral-800 border rounded text-neutral-900 dark:text-white placeholder-neutral-400 ${
                                errors[`resource_url_${idx}`]
                                  ? 'border-rose-300'
                                  : 'border-neutral-200 dark:border-neutral-700'
                              }`}
                            />
                            {errors[`resource_url_${idx}`] && (
                              <p className="text-[10px] text-rose-500 mt-0.5">{errors[`resource_url_${idx}`]}</p>
                            )}
                          </div>
                          {resource.url && (
                            <a
                              href={resource.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-4 p-1.5 text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded transition-colors"
                              title="Open URL"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => removeResource(idx)}
                            className="mt-4 p-1.5 text-neutral-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-colors"
                            title="Remove resource"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Remarks */}
              <div>
                <label htmlFor="slide-remarks" className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1.5">
                  Remarks / Mentor Notes
                </label>
                <textarea
                  id="slide-remarks"
                  rows={2}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="e.g. Student performed well on schema questions..."
                  className="w-full px-3 py-2 text-sm bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              {/* Footer */}
              <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between gap-3">
                {editingSession ? (
                  <button
                    type="button"
                    onClick={() => {
                      dispatch(setDeletingSessionId(editingSession.id));
                      dispatch(closePanel());
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Session
                  </button>
                ) : (
                  <span />
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => dispatch(closePanel())}
                    className="px-4 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg shadow-xs transition-colors"
                  >
                    {editingSession ? 'Save Changes' : 'Log Session'}
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
}
