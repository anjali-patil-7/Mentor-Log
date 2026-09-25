import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './index';
import { Student, Session, Assignment, Track, FilterState, DashboardStatsData } from '../types';
import { isDateInThisWeek, isDateInThisMonth, getTodayString } from '../utils/dateTime';

export function useStudents(): Student[] {
  const students = useLiveQuery(() => db.students.toArray());
  return students || [];
}

export function useSessions(): Session[] {
  const sessions = useLiveQuery(() => db.sessions.toArray());
  return sessions || [];
}

export function useAssignments(): Assignment[] {
  const assignments = useLiveQuery(() => db.assignments.toArray());
  return assignments || [];
}

export function useTracks(): Track[] {
  const tracks = useLiveQuery(() => db.tracks.toArray());
  return tracks || [];
}

export function useStudentById(studentIdOrId: string): Student | null {
  const student = useLiveQuery(async () => {
    if (!studentIdOrId) return null;
    const byStuId = await db.students.where('studentId').equals(studentIdOrId).first();
    if (byStuId) return byStuId;
    const byId = await db.students.get(studentIdOrId);
    return byId || null;
  }, [studentIdOrId]);

  return student || null;
}



export function useFilteredSessions(filters: FilterState): {
  filteredSessions: Session[];
  totalSessions: Session[];
} {
  const allSessions = useSessions();
  const tracks = useTracks();

  const trackMap = new Map(tracks.map((t) => [t.id, t.name]));
  const query = filters.searchQuery.trim().toLowerCase();
  const today = getTodayString();

  const filtered = allSessions.filter((s) => {
    // 1. Search Query across fields
    if (query) {
      const studentMatch = (s.studentName || '').toLowerCase().includes(query);
      const studentIdMatch = (s.studentId || '').toLowerCase().includes(query);
      const topicsMatch = (s.topicsTaught || '').toLowerCase().includes(query);
      const upcomingMatch = (s.upcomingTopics || '').toLowerCase().includes(query);
      const tasksMatch = (s.taskAssignment || '').toLowerCase().includes(query);
      const remarksMatch = (s.remarks || '').toLowerCase().includes(query);
      const trackName = (trackMap.get(s.trackId) || '').toLowerCase();
      const trackMatch = trackName.includes(query);

      if (
        !studentMatch &&
        !studentIdMatch &&
        !topicsMatch &&
        !upcomingMatch &&
        !tasksMatch &&
        !remarksMatch &&
        !trackMatch
      ) {
        return false;
      }
    }

    // 2. Student Filter
    if (filters.studentId !== 'all' && s.studentId !== filters.studentId) {
      return false;
    }

    // 3. Domain (Track) Filter
    if (filters.trackId !== 'all' && s.trackId !== filters.trackId) {
      return false;
    }

    // 4. Session Status Filter (was classStatus)
    const effectiveStatus = s.sessionStatus || (s as any).classStatus;
    if (filters.sessionStatus !== 'all' && effectiveStatus !== filters.sessionStatus) {
      return false;
    }

    // 5. Attendance Filter
    if (filters.attendance !== 'all' && s.attendance !== filters.attendance) {
      return false;
    }

    // 6. Assignment Status Filter
    if (filters.assignmentStatus !== 'all' && s.assignmentStatus !== filters.assignmentStatus) {
      return false;
    }

    // 7. Date Range Filter
    if (filters.datePreset === 'today') {
      if (s.date !== today) return false;
    } else if (filters.datePreset === 'this_week') {
      if (!isDateInThisWeek(s.date)) return false;
    } else if (filters.datePreset === 'this_month') {
      if (!isDateInThisMonth(s.date)) return false;
    } else if (filters.datePreset === 'custom') {
      if (filters.startDate && s.date < filters.startDate) return false;
      if (filters.endDate && s.date > filters.endDate) return false;
    }

    return true;
  });

  // Sorting
  const { sortField, sortDirection } = filters;
  const modifier = sortDirection === 'asc' ? 1 : -1;

  const sorted = [...filtered].sort((a, b) => {
    if (sortField === 'date') {
      const dateA = `${a.date} ${a.startTime || '00:00'}`;
      const dateB = `${b.date} ${b.startTime || '00:00'}`;
      return dateA.localeCompare(dateB) * modifier;
    }
    if (sortField === 'studentName') {
      return (a.studentName || '').localeCompare(b.studentName || '') * modifier;
    }
    if (sortField === 'track') {
      const trackA = trackMap.get(a.trackId) || a.trackId;
      const trackB = trackMap.get(b.trackId) || b.trackId;
      return trackA.localeCompare(trackB) * modifier;
    }
    if (sortField === 'duration') {
      return ((a.durationMinutes || 0) - (b.durationMinutes || 0)) * modifier;
    }
    if (sortField === 'sessionStatus') {
      const statusA = a.sessionStatus || (a as any).classStatus || '';
      const statusB = b.sessionStatus || (b as any).classStatus || '';
      return statusA.localeCompare(statusB) * modifier;
    }
    return 0;
  });

  return {
    filteredSessions: sorted,
    totalSessions: allSessions,
  };
}

export function useDashboardStats(): DashboardStatsData {
  const sessions = useSessions();
  const students = useStudents();
  const tracks = useTracks();
  const assignments = useAssignments();

  let totalMinutes = 0;
  let thisWeekCount = 0;
  let thisMonthCount = 0;
  let completedCount = 0;
  let cancelledCount = 0;
  let rescheduledCount = 0;
  let pendingCount = 0;
  let holidayCount = 0;

  let presentCount = 0;
  let absentCount = 0;
  let lateCount = 0;
  let excusedCount = 0;
  let attendanceHolidayCount = 0;
  let naCount = 0;

  const trackCounts: Record<string, { count: number; minutes: number }> = {};
  tracks.forEach((t) => {
    trackCounts[t.id] = { count: 0, minutes: 0 };
  });

  sessions.forEach((s) => {
    const status = s.sessionStatus || (s as any).classStatus || 'Completed';

    if (status === 'Completed') {
      totalMinutes += s.durationMinutes || 0;
      completedCount++;
    } else if (status === 'Cancelled') {
      cancelledCount++;
    } else if (status === 'Rescheduled') {
      rescheduledCount++;
    } else if (status === 'Pending') {
      pendingCount++;
    } else if (status === 'Holiday') {
      holidayCount++;
    }

    if (s.attendance === 'Present') presentCount++;
    else if (s.attendance === 'Absent') absentCount++;
    else if (s.attendance === 'Late') lateCount++;
    else if (s.attendance === 'Excused') excusedCount++;
    else if (s.attendance === 'Holiday') attendanceHolidayCount++;
    else if (s.attendance === 'Not Applicable') naCount++;

    if (isDateInThisWeek(s.date)) thisWeekCount++;
    if (isDateInThisMonth(s.date)) thisMonthCount++;

    if (!trackCounts[s.trackId]) {
      trackCounts[s.trackId] = { count: 0, minutes: 0 };
    }
    trackCounts[s.trackId].count++;
    if (status === 'Completed') {
      trackCounts[s.trackId].minutes += s.durationMinutes || 0;
    }
  });

  const totalSessions = sessions.length;
  const applicableAttendance = presentCount + absentCount + lateCount + excusedCount;
  const attendanceRate = applicableAttendance > 0
    ? Math.round(((presentCount + lateCount) / applicableAttendance) * 100)
    : 100;

  const pendingTasksCount = assignments.filter((a) => a.status !== 'Completed').length;

  const trackBreakdown = tracks.map((t) => {
    const stats = trackCounts[t.id] || { count: 0, minutes: 0 };
    const percentage = totalSessions > 0 ? Math.round((stats.count / totalSessions) * 100) : 0;
    return {
      trackId: t.id,
      trackName: t.name,
      color: t.color,
      count: stats.count,
      hours: Number((stats.minutes / 60).toFixed(1)),
      percentage,
    };
  });

  return {
    totalStudents: students.length,
    totalSessions,
    totalHoursMentored: Number((totalMinutes / 60).toFixed(1)),
    totalMinutesMentored: totalMinutes,
    attendanceRate,
    sessionsThisWeek: thisWeekCount,
    sessionsThisMonth: thisMonthCount,
    pendingTasksCount,
    statusBreakdown: {
      completed: completedCount,
      cancelled: cancelledCount,
      rescheduled: rescheduledCount,
      pending: pendingCount,
      holiday: holidayCount,
    },
    attendanceBreakdown: {
      present: presentCount,
      absent: absentCount,
      late: lateCount,
      excused: excusedCount,
      holiday: attendanceHolidayCount,
      na: naCount,
    },
    trackBreakdown,
  };
}
