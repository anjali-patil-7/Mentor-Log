import { db } from './index';
import { Student, Session, Assignment, Track, BackupData, SessionStatus, AttendanceStatus, AssignmentStatus, SessionResource } from '../types';
import { calculateDay, calculateDuration } from '../utils/dateTime';

/**
 * Operations for Students
 */
export async function addStudentDB(studentData: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>) {
  let studentId = studentData.studentId;
  if (!studentId || !studentId.startsWith('STU-')) {
    const existing = await db.students.toArray();
    const maxNum = existing.reduce((max, s) => {
      const match = s.studentId ? s.studentId.match(/STU-(\d+)/) : null;
      if (match) {
        const num = parseInt(match[1], 10);
        return num > max ? num : max;
      }
      return max;
    }, 0);
    studentId = `STU-${String(maxNum + 1).padStart(3, '0')}`;
  }

  const newStudent: Student = {
    ...studentData,
    id: `stu-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    studentId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await db.students.put(newStudent);
  return newStudent;
}

export async function updateStudentDB(student: Student) {
  const updated = {
    ...student,
    updatedAt: new Date().toISOString(),
  };
  await db.students.put(updated);
  return updated;
}

export async function deleteStudentDB(id: string) {
  const student = await db.students.get(id);
  if (student) {
    await db.students.delete(id);
    await db.sessions.where('studentId').equals(student.studentId).modify({ studentId: '' });
  }
}

/**
 * Operations for Sessions
 */
export async function addSessionDB(sessionData: Omit<Session, 'id' | 'day' | 'durationMinutes' | 'durationText' | 'createdAt' | 'updatedAt'>) {
  const day = calculateDay(sessionData.date);
  const { minutes: durationMinutes, text: durationText } = calculateDuration(sessionData.startTime, sessionData.endTime);
  const now = new Date().toISOString();

  let studentName = sessionData.studentName;
  if (sessionData.studentId) {
    const student = await db.students.where('studentId').equals(sessionData.studentId).first();
    if (student) {
      studentName = student.studentName;
    }
  }

  const newSession: Session = {
    ...sessionData,
    studentName,
    id: `sess-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    day,
    durationMinutes,
    durationText,
    upcomingTopics: sessionData.upcomingTopics || '',
    sessionResources: sessionData.sessionResources || [],
    createdAt: now,
    updatedAt: now,
  };

  await db.sessions.put(newSession);

  if (newSession.taskAssignment && newSession.taskAssignment.trim()) {
    await db.assignments.put({
      id: `asgn-${newSession.id}`,
      studentId: newSession.studentId,
      studentName: newSession.studentName,
      sessionId: newSession.id,
      taskTitle: newSession.taskAssignment.trim(),
      assignedDate: newSession.date,
      dueDate: newSession.date,
      status: newSession.assignmentStatus || 'Assigned',
      trackId: newSession.trackId,
      notes: `Created from session on ${newSession.date}`,
      createdAt: now,
      updatedAt: now,
    });
  }

  return newSession;
}

export async function updateSessionDB(session: Session) {
  const day = calculateDay(session.date);
  const { minutes: durationMinutes, text: durationText } = calculateDuration(session.startTime, session.endTime);
  const now = new Date().toISOString();

  let studentName = session.studentName;
  if (session.studentId) {
    const student = await db.students.where('studentId').equals(session.studentId).first();
    if (student) {
      studentName = student.studentName;
    }
  }

  const updated: Session = {
    ...session,
    studentName,
    day,
    durationMinutes,
    durationText,
    upcomingTopics: session.upcomingTopics || '',
    sessionResources: session.sessionResources || [],
    updatedAt: now,
  };

  await db.sessions.put(updated);
  return updated;
}

export async function duplicateSessionDB(sessionId: string) {
  const original = await db.sessions.get(sessionId);
  if (!original) throw new Error('Original session not found');

  const now = new Date().toISOString();
  const newId = `sess-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const duplicated: Session = {
    ...original,
    id: newId,
    // Give new IDs to any resources so they are independent
    sessionResources: (original.sessionResources || []).map((r) => ({
      ...r,
      id: `res-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    })),
    createdAt: now,
    updatedAt: now,
  };

  await db.sessions.put(duplicated);
  return duplicated;
}

export async function deleteSessionDB(id: string) {
  await db.sessions.delete(id);
  await db.assignments.delete(`asgn-${id}`);
}

export async function updateSessionStatusDB(id: string, status: SessionStatus) {
  const session = await db.sessions.get(id);
  if (session) {
    session.sessionStatus = status;
    session.updatedAt = new Date().toISOString();
    await db.sessions.put(session);
  }
}

/**
 * Operations for Assignments
 */
export async function addAssignmentDB(assignmentData: Omit<Assignment, 'id' | 'createdAt' | 'updatedAt'>) {
  const now = new Date().toISOString();
  const newAssignment: Assignment = {
    ...assignmentData,
    id: `asgn-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    createdAt: now,
    updatedAt: now,
  };
  await db.assignments.put(newAssignment);
  return newAssignment;
}

export async function updateAssignmentDB(assignment: Assignment) {
  const updated = {
    ...assignment,
    updatedAt: new Date().toISOString(),
  };
  await db.assignments.put(updated);
  return updated;
}

export async function updateAssignmentStatusDB(id: string, status: AssignmentStatus) {
  const assignment = await db.assignments.get(id);
  if (assignment) {
    assignment.status = status;
    assignment.updatedAt = new Date().toISOString();
    await db.assignments.put(assignment);
  }
}

export async function deleteAssignmentDB(id: string) {
  await db.assignments.delete(id);
}

/**
 * Operations for Tracks
 */
export async function addTrackDB(track: Track) {
  await db.tracks.put(track);
}

export async function deleteTrackDB(id: string) {
  await db.tracks.delete(id);
}

/**
 * Backup and Restore Operations
 */
export async function getCompleteBackupData(): Promise<BackupData> {
  const students = await db.students.toArray();
  const sessions = await db.sessions.toArray();
  const assignments = await db.assignments.toArray();
  const tracks = await db.tracks.toArray();

  return {
    version: 2,
    exportedAt: new Date().toISOString(),
    students,
    sessions,
    assignments,
    tracks,
  };
}

export async function restoreBackupDataDB(backup: BackupData) {
  if (!backup || typeof backup !== 'object') {
    throw new Error('Invalid backup data structure');
  }

  const students = Array.isArray(backup.students) ? backup.students : [];
  const sessions = Array.isArray(backup.sessions) ? backup.sessions : [];
  const assignments = Array.isArray(backup.assignments) ? backup.assignments : [];
  const tracks = Array.isArray(backup.tracks) ? backup.tracks : [];

  // Safe migration of sessions from backup (in case it's an older backup)
  const migratedSessions: Session[] = sessions.map((s: any) => ({
    ...s,
    sessionStatus: s.sessionStatus || s.classStatus || 'Completed',
    upcomingTopics: s.upcomingTopics || '',
    sessionResources: Array.isArray(s.sessionResources)
      ? s.sessionResources
      : s.recordingClassLink
      ? [{ id: `res-restore-${Date.now()}`, type: 'Recording', title: 'Session Recording', url: s.recordingClassLink }]
      : [],
  }));

  await db.transaction('rw', [db.students, db.sessions, db.assignments, db.tracks], async () => {
    await db.students.clear();
    await db.sessions.clear();
    await db.assignments.clear();
    await db.tracks.clear();

    if (students.length > 0) await db.students.bulkPut(students);
    if (migratedSessions.length > 0) await db.sessions.bulkPut(migratedSessions);
    if (assignments.length > 0) await db.assignments.bulkPut(assignments);
    if (tracks.length > 0) await db.tracks.bulkPut(tracks);
  });
}
