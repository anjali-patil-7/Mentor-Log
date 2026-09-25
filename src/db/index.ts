import Dexie, { Table } from 'dexie';
import { Student, Session, Assignment, Track } from '../types';
import { DEFAULT_TRACKS, INITIAL_STUDENTS, INITIAL_SESSIONS, INITIAL_ASSIGNMENTS } from '../utils/mockData';

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
  }
}

export const db = new MentorLogDB();

/**
 * Perform initial database seeding with real Google Sheet data and safe migration
 */
export async function initAndMigrateDatabase() {
  try {
    const isSeeded = await db.settings.get('googleSheetSeeded_v2');
    if (isSeeded && isSeeded.value) {
      return;
    }

    await seedDatabase(true);
  } catch (err) {
    console.warn('Database initialization error encountered. Retrying clean seed with real data...', err);
    try {
      await seedDatabase(true);
    } catch (retryErr) {
      console.error('Fatal database seed error:', retryErr);
    }
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

