// Session Status (replaces ClassStatus — includes Holiday)
export type SessionStatus = 'Completed' | 'Cancelled' | 'Rescheduled' | 'Pending' | 'Holiday';

// Keep ClassStatus as alias for backward compat during migration reads
export type ClassStatus = SessionStatus;

export type AttendanceStatus =
  | 'Present'
  | 'Absent'
  | 'Late'
  | 'Excused'
  | 'Holiday'
  | 'Not Applicable';

export type ProgressLevel =
  | 'Needs Improvement'
  | 'Beginner'
  | 'Developing'
  | 'Good'
  | 'Strong';

export type AssignmentStatus =
  | 'Assigned'
  | 'In Progress'
  | 'Submitted'
  | 'Reviewed'
  | 'Completed'
  | 'Not Completed'
  | 'Overdue';

export type CancellationReason =
  | 'Student unavailable'
  | 'Mentor unavailable'
  | 'Technical issue'
  | 'Holiday'
  | 'Schedule conflict'
  | 'Personal reason'
  | 'Other';

export interface Student {
  id: string; // Dexie primary key / UUID
  studentId: string; // Unique human ID, e.g. STU-001
  studentName: string;
  email: string;
  phone: string;
  domain: string; // Domain (previously Track / Domain)
  batch: string;
  joiningDate: string; // YYYY-MM-DD
  status: 'Active' | 'Inactive' | 'Completed';
  notes: string;
  createdAt: string;
  updatedAt: string;
}

/** A single session resource (recording, link, docs, etc.) */
export interface SessionResource {
  id: string;
  type: 'Recording' | 'Meeting Link' | 'GitHub' | 'Documentation' | 'Reference' | 'Other';
  title: string;
  url: string;
}

export interface Session {
  id: string;
  studentId: string; // References Student.studentId
  studentName: string; // Resolved student name
  trackId: string; // References Track.id (Domain)
  date: string; // YYYY-MM-DD
  day: string; // Monday, Tuesday, etc. (auto-calculated)
  startTime: string; // HH:mm (24hr, e.g. 09:30)
  endTime: string; // HH:mm (24hr, e.g. 11:00)
  durationMinutes: number; // e.g. 90
  durationText: string; // e.g. "1h 30m"
  sessionStatus: SessionStatus;
  /** @deprecated kept for safe migration reads only — use sessionStatus */
  classStatus?: SessionStatus;
  attendance: AttendanceStatus;
  topicsTaught: string;
  upcomingTopics: string; // Topics planned for next session
  taskAssignment: string;
  assignmentStatus: AssignmentStatus;
  sessionResources: SessionResource[]; // Array of resources (recording, links, etc.)
  /** @deprecated use sessionResources — kept for migration reads */
  recordingClassLink?: string;
  progressLevel?: ProgressLevel;
  remarks: string;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Assignment {
  id: string;
  studentId: string;
  studentName: string;
  sessionId?: string;
  taskTitle: string;
  assignedDate: string;
  dueDate: string;
  status: AssignmentStatus;
  trackId: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Track {
  id: string;
  name: string;
  color: string;
  isCustom?: boolean;
}

export type DatePreset = 'all' | 'today' | 'this_week' | 'this_month' | 'custom';

export type SortField = 'date' | 'studentName' | 'track' | 'duration' | 'sessionStatus';
export type SortDirection = 'asc' | 'desc';

export interface FilterState {
  searchQuery: string;
  studentId: string; // 'all' or specific studentId
  trackId: string; // 'all' or specific trackId
  sessionStatus: 'all' | SessionStatus;
  attendance: 'all' | AttendanceStatus;
  assignmentStatus: 'all' | AssignmentStatus;
  datePreset: DatePreset;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  sortField: SortField;
  sortDirection: SortDirection;
}

export interface UIState {
  isPanelOpen: boolean;
  editingSessionId: string | null;
  duplicatingSessionId: string | null;
  viewingSessionId: string | null; // For read-only Session Details modal
  theme: 'system' | 'light' | 'dark';
  isAddTrackModalOpen: boolean;
  isAddStudentModalOpen: boolean;
  isAddAssignmentModalOpen: boolean;
  isImportModalOpen: boolean;
  editingStudentId: string | null;
  editingAssignmentId: string | null;
  deletingSessionId: string | null;
  deletingStudentId: string | null;
  deletingAssignmentId: string | null;
  selectedStudentIds: string[];
}

export interface DashboardStatsData {
  totalStudents: number;
  totalSessions: number;
  totalHoursMentored: number;
  totalMinutesMentored: number;
  attendanceRate: number;
  sessionsThisWeek: number;
  sessionsThisMonth: number;
  pendingTasksCount: number;
  statusBreakdown: {
    completed: number;
    cancelled: number;
    rescheduled: number;
    pending: number;
    holiday: number;
  };
  attendanceBreakdown: {
    present: number;
    absent: number;
    late: number;
    excused: number;
    holiday: number;
    na: number;
  };
  trackBreakdown: Array<{
    trackId: string;
    trackName: string;
    color: string;
    count: number;
    hours: number;
    percentage: number;
  }>;
}

export interface BackupData {
  version: number;
  exportedAt: string;
  students: Student[];
  sessions: Session[];
  assignments: Assignment[];
  tracks: Track[];
}
