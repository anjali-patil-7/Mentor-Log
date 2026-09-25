import Dexie, { Table } from 'dexie';
import { Student, Session, Assignment, Track } from '../types';
import { DEFAULT_TRACKS, INITIAL_STUDENTS, INITIAL_SESSIONS, INITIAL_ASSIGNMENTS } from '../utils/mockData';
import { resolveDomainAndCourse } from '../utils/domainCourses';

export class MentorLogDB extends Dexie {
  students!: Table<Student, string>;
  sessions!: Table<Session, string>;
  assignments!: Table<Assignment, string>;
  tracks!: Table<Track, string>;
  settings!: Table<{ key: string; value: any }, string>;

  constructor() {
    super('MentorLogDB');

    // Version 1: original schema
    this.version(1).stores({
      students: 'id, &studentId, studentName, domain, status, createdAt',
      sessions: 'id, studentId, studentName, trackId, date, classStatus, attendance, createdAt',
      assignments: 'id, studentId, sessionId, status, trackId, dueDate, createdAt',
      tracks: 'id, name',
      settings: 'key',
    });

    // Version 2: migrate classStatus → sessionStatus, add upcomingTopics, sessionResources
    this.version(2)
      .stores({
        students: 'id, &studentId, studentName, domain, status, createdAt',
        sessions: 'id, studentId, studentName, trackId, date, sessionStatus, attendance, createdAt',
        assignments: 'id, studentId, sessionId, status, trackId, dueDate, createdAt',
        tracks: 'id, name',
        settings: 'key',
      })
      .upgrade(async (tx) => {
        await tx
          .table('sessions')
          .toCollection()
          .modify((session: any) => {
            // Migrate classStatus → sessionStatus
            if (!session.sessionStatus && session.classStatus) {
              session.sessionStatus = session.classStatus;
            } else if (!session.sessionStatus) {
              session.sessionStatus = 'Completed';
            }

            // Migrate recordingClassLink → sessionResources array
            if (!session.sessionResources || !Array.isArray(session.sessionResources)) {
              session.sessionResources = [];
              if (session.recordingClassLink && session.recordingClassLink.trim()) {
                session.sessionResources.push({
                  id: `res-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                  type: 'Recording',
                  title: 'Session Recording',
                  url: session.recordingClassLink.trim(),
                });
              }
            }

            // Add missing upcomingTopics field
            if (session.upcomingTopics === undefined) {
              session.upcomingTopics = '';
            }
          });
      });

    // Version 3: Domain → Course structure
    this.version(3)
      .stores({
        students: 'id, &studentId, studentName, domain, course, status, createdAt',
        sessions: 'id, studentId, studentName, domain, course, trackId, date, sessionStatus, attendance, createdAt',
        assignments: 'id, studentId, sessionId, domain, course, status, trackId, dueDate, createdAt',
        tracks: 'id, name, domain',
        settings: 'key',
      })
      .upgrade(async (tx) => {
        // Upgrade students with domain + course
        await tx
          .table('students')
          .toCollection()
          .modify((student: any) => {
            const resolved = resolveDomainAndCourse(student.domain, student.course);
            student.domain = resolved.domain;
            student.course = resolved.course;
          });

        // Upgrade sessions with domain + course
        await tx
          .table('sessions')
          .toCollection()
          .modify((session: any) => {
            const resolved = resolveDomainAndCourse(session.domain, session.course, session.trackId);
            session.domain = resolved.domain;
            session.course = resolved.course;
          });

        // Upgrade assignments with domain + course
        await tx
          .table('assignments')
          .toCollection()
          .modify((assignment: any) => {
            const resolved = resolveDomainAndCourse(assignment.domain, assignment.course, assignment.trackId);
            assignment.domain = resolved.domain;
            assignment.course = resolved.course;
          });
      });
  }
}

export const db = new MentorLogDB();

/**
 * Perform initial database seeding with real Google Sheet data and safe migration
 */
export async function initAndMigrateDatabase() {
  try {
    const isSeeded = await db.settings.get('googleSheetSeeded_v2');
    if (!isSeeded || !isSeeded.value) {
      await seedDatabase(true);
      return;
    }

    // Ensure all canonical tracks exist
    const currentTracks = await db.tracks.toArray();
    const existingTrackIds = new Set(currentTracks.map((t) => t.id));
    const missingTracks = DEFAULT_TRACKS.filter((t) => !existingTrackIds.has(t.id));
    if (missingTracks.length > 0) {
      await db.tracks.bulkPut(missingTracks);
    }

    // Check if domain-course migration was applied
    const domainMigrated = await db.settings.get('domainCourseMigration_v1');
    if (!domainMigrated) {
      await db.transaction('rw', [db.students, db.sessions, db.assignments, db.tracks, db.settings], async () => {
        await db.students.toCollection().modify((student: any) => {
          const resolved = resolveDomainAndCourse(student.domain, student.course);
          student.domain = resolved.domain;
          student.course = resolved.course;
        });

        await db.sessions.toCollection().modify((session: any) => {
          const resolved = resolveDomainAndCourse(session.domain, session.course, session.trackId);
          session.domain = resolved.domain;
          session.course = resolved.course;
        });

        await db.assignments.toCollection().modify((assignment: any) => {
          const resolved = resolveDomainAndCourse(assignment.domain, assignment.course, assignment.trackId);
          assignment.domain = resolved.domain;
          assignment.course = resolved.course;
        });

        await db.tracks.bulkPut(DEFAULT_TRACKS);
        await db.settings.put({ key: 'domainCourseMigration_v1', value: true });
      });
    }
  } catch (err) {
    console.warn('Database initialization error encountered:', err);
  }
}

/**
 * Seed database tables cleanly with real Google Sheet data
 */
export async function seedDatabase(forceClear = true) {
  // Clear legacy localStorage dummy data keys if present
  try {
    localStorage.removeItem('mentor_log_tracks_v1');
    localStorage.removeItem('mentor_log_sessions_v1');
  } catch (e) {
    console.error('Error clearing legacy storage keys', e);
  }

  const studentsToInsert: Student[] = INITIAL_STUDENTS;
  const sessionsToInsert: Session[] = INITIAL_SESSIONS;
  const assignmentsToInsert: Assignment[] = INITIAL_ASSIGNMENTS;
  const tracksToInsert: Track[] = DEFAULT_TRACKS;

  // Transactional Database Write
  await db.transaction('rw', [db.students, db.sessions, db.assignments, db.tracks, db.settings], async () => {
    if (forceClear) {
      await db.students.clear();
      await db.sessions.clear();
      await db.assignments.clear();
      await db.tracks.clear();
    }
    await db.students.bulkPut(studentsToInsert);
    await db.sessions.bulkPut(sessionsToInsert);
    await db.assignments.bulkPut(assignmentsToInsert);
    await db.tracks.bulkPut(tracksToInsert);
    await db.settings.put({ key: 'googleSheetSeeded_v2', value: true });
    await db.settings.put({ key: 'migrationCompleted', value: true });
  });

  console.log('Successfully initialized Dexie IndexedDB with real Google Sheet records!');
}

