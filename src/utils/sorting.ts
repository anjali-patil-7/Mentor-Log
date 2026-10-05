import { Session, Student } from '../types';

export type StudentSortOrder = 'id-asc' | 'id-desc' | 'oldest' | 'latest' | 'name-asc';

/**
 * Sorts sessions chronologically by date and start time.
 * - 'latest': newest session first (descending date/time)
 * - 'oldest': oldest session first (ascending date/time)
 */
export function sortSessions(
  sessions: Session[],
  order: 'latest' | 'oldest' = 'latest'
): Session[] {
  return [...sessions].sort((a, b) => {
    const dateA = a.date || '';
    const dateB = b.date || '';
    if (dateA !== dateB) {
      return order === 'latest' ? dateB.localeCompare(dateA) : dateA.localeCompare(dateB);
    }
    const timeA = a.startTime || '';
    const timeB = b.startTime || '';
    return order === 'latest' ? timeB.localeCompare(timeA) : timeA.localeCompare(timeB);
  });
}

/**
 * Sorts multi-student session list:
 * First grouped/sorted by Student ID in natural order (STU-001, STU-002...),
 * then each student's sessions are sorted by date/time according to the selected order.
 */
export function sortMultiStudentSessions(
  sessions: Session[],
  order: 'latest' | 'oldest' = 'latest'
): Session[] {
  return [...sessions].sort((a, b) => {
    const idA = a.studentId || '';
    const idB = b.studentId || '';
    if (idA !== idB) {
      const comp = idA.localeCompare(idB, undefined, { numeric: true, sensitivity: 'base' });
      if (comp !== 0) return comp;
    }
    const dateA = a.date || '';
    const dateB = b.date || '';
    if (dateA !== dateB) {
      return order === 'latest' ? dateB.localeCompare(dateA) : dateA.localeCompare(dateB);
    }
    const timeA = a.startTime || '';
    const timeB = b.startTime || '';
    return order === 'latest' ? timeB.localeCompare(timeA) : timeA.localeCompare(timeB);
  });
}

/**
 * Sorts student list in proper right order:
 * - 'id-asc': Natural alphanumeric Student ID order (STU-001, STU-002, ..., STU-010). Default proper order.
 * - 'id-desc': Natural alphanumeric Student ID order reversed.
 * - 'oldest': Oldest to latest by joiningDate (chronological enrollment).
 * - 'latest': Latest to oldest by joiningDate (newest enrollment first).
 * - 'name-asc': Alphabetical by studentName.
 */
export function sortStudentsProperOrder(
  students: Student[],
  order: StudentSortOrder = 'id-asc'
): Student[] {
  return [...students].sort((a, b) => {
    if (order === 'latest') {
      const dateA = a.joiningDate || a.createdAt || '';
      const dateB = b.joiningDate || b.createdAt || '';
      if (dateA !== dateB) return dateB.localeCompare(dateA);
      return (b.studentId || '').localeCompare(a.studentId || '', undefined, { numeric: true });
    }

    if (order === 'oldest') {
      const dateA = a.joiningDate || a.createdAt || '';
      const dateB = b.joiningDate || b.createdAt || '';
      if (dateA !== dateB) return dateA.localeCompare(dateB);
      return (a.studentId || '').localeCompare(b.studentId || '', undefined, { numeric: true });
    }

    if (order === 'name-asc') {
      const nameComp = (a.studentName || '').localeCompare(b.studentName || '');
      if (nameComp !== 0) return nameComp;
      return (a.studentId || '').localeCompare(b.studentId || '', undefined, { numeric: true });
    }

    if (order === 'id-desc') {
      const idA = a.studentId || '';
      const idB = b.studentId || '';
      const comp = idB.localeCompare(idA, undefined, { numeric: true, sensitivity: 'base' });
      if (comp !== 0) return comp;
      return (b.studentName || '').localeCompare(a.studentName || '');
    }

    // Default 'id-asc': STU-001, STU-002, STU-003, ... (proper right order)
    const idA = a.studentId || '';
    const idB = b.studentId || '';
    if (idA && idB) {
      const comp = idA.localeCompare(idB, undefined, { numeric: true, sensitivity: 'base' });
      if (comp !== 0) return comp;
    }
    return (a.studentName || '').localeCompare(b.studentName || '');
  });
}
