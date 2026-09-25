import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Session, Student, Track, BackupData, Assignment } from '../types';
import { formatDateDisplay, formatTimeDisplay } from './dateTime';
import { resolveDomainAndCourse } from './domainCourses';

/**
 * Format Session rows for tabular exports
 */
function prepareSessionRows(sessions: Session[], tracks: Track[]) {
  const trackMap = new Map(tracks.map((t) => [t.id, t.name]));

  return sessions.map((s) => {
    const { domain, course } = resolveDomainAndCourse(s.domain, s.course, s.trackId);
    return {
      'Student ID': s.studentId || '—',
      'Student Name': s.studentName || '—',
      Date: s.date,
      Day: s.day,
      Domain: domain,
      Course: course,
      'Start Time': formatTimeDisplay(s.startTime),
      'End Time': formatTimeDisplay(s.endTime),
      Duration: s.durationText,
      'Session Status': s.sessionStatus || s.classStatus,
      Attendance: s.attendance || 'Present',
      'Topics Taught': s.topicsTaught || '—',
      'Task / Assignment': s.taskAssignment || '—',
      'Assignment Status': s.assignmentStatus || '—',
      'Progress Level': s.progressLevel || '—',
      'Recording Link': (s.sessionResources && s.sessionResources[0]?.url) || s.recordingClassLink || '—',
      Remarks: s.remarks || '—',
      'Cancellation Reason': (s.sessionStatus || s.classStatus) === 'Cancelled' ? s.cancellationReason || '—' : 'N/A',
    };
  });
}

/**
 * Export sessions or student session logs to Excel (.xlsx)
 */
export function exportSessionsToExcel(
  sessions: Session[],
  tracks: Track[],
  filename = 'mentor-log-sessions.xlsx'
) {
  const data = prepareSessionRows(sessions, tracks);
  const worksheet = XLSX.utils.json_to_sheet(data);

  worksheet['!cols'] = [
    { wch: 12 }, // Student ID
    { wch: 20 }, // Student Name
    { wch: 12 }, // Date
    { wch: 12 }, // Day
    { wch: 14 }, // Domain
    { wch: 22 }, // Course
    { wch: 12 }, // Start
    { wch: 12 }, // End
    { wch: 10 }, // Duration
    { wch: 14 }, // Status
    { wch: 14 }, // Attendance
    { wch: 35 }, // Topics
    { wch: 35 }, // Assignment
    { wch: 16 }, // Task Status
    { wch: 16 }, // Progress
    { wch: 30 }, // Link
    { wch: 30 }, // Remarks
    { wch: 20 }, // Reason
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Session History');
  XLSX.writeFile(workbook, filename);
}

/**
 * Export sessions to CSV (.csv)
 */
export function exportSessionsToCsv(
  sessions: Session[],
  tracks: Track[],
  filename = 'mentor-log-sessions.csv'
) {
  const data = prepareSessionRows(sessions, tracks);
  if (data.length === 0) {
    const emptyBlob = new Blob(['Student ID,Student Name,Date,Day,Domain,Course,Start Time,End Time,Duration,Session Status,Attendance,Topics Taught,Task / Assignment,Assignment Status,Progress Level,Recording Link,Remarks,Cancellation Reason\n'], {
      type: 'text/csv;charset=utf-8;',
    });
    triggerDownload(emptyBlob, filename);
    return;
  }

  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(',')];

  for (const row of data) {
    const values = headers.map((header) => {
      const val = (row as Record<string, any>)[header];
      const str = val === undefined || val === null ? '' : String(val);
      const escaped = str.replace(/"/g, '""');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(','));
  }

  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  triggerDownload(blob, filename);
}

/**
 * Export Student Master List to Excel / CSV
 */
export function exportStudentsToExcel(students: Student[], filename = 'mentor-log-students.xlsx') {
  const data = students.map((s) => {
    const { domain, course } = resolveDomainAndCourse(s.domain, s.course);
    return {
      'Student ID': s.studentId,
      'Student Name': s.studentName,
      Email: s.email,
      Phone: s.phone,
      Domain: domain,
      Course: course,
      Batch: s.batch,
      'Joining Date': s.joiningDate,
      Status: s.status,
      Notes: s.notes,
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(data);
  worksheet['!cols'] = [
    { wch: 12 }, // ID
    { wch: 22 }, // Name
    { wch: 26 }, // Email
    { wch: 16 }, // Phone
    { wch: 14 }, // Domain
    { wch: 24 }, // Course
    { wch: 12 }, // Batch
    { wch: 14 }, // Date
    { wch: 12 }, // Status
    { wch: 30 }, // Notes
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');
  XLSX.writeFile(workbook, filename);
}

export function exportStudentsToCsv(students: Student[], filename = 'mentor-log-students.csv') {
  const data = students.map((s) => {
    const { domain, course } = resolveDomainAndCourse(s.domain, s.course);
    return {
      'Student ID': s.studentId,
      'Student Name': s.studentName,
      Email: s.email,
      Phone: s.phone,
      Domain: domain,
      Course: course,
      Batch: s.batch,
      'Joining Date': s.joiningDate,
      Status: s.status,
      Notes: s.notes,
    };
  });

  if (data.length === 0) return;
  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(',')];

  for (const row of data) {
    const values = headers.map((header) => {
      const val = (row as Record<string, any>)[header];
      const str = val === undefined || val === null ? '' : String(val);
      return `"${str.replace(/"/g, '""')}"`;
    });
    csvRows.push(values.join(','));
  }

  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  triggerDownload(blob, filename);
}

/**
 * Generate PDF Mentor Progress Report for an individual student or filtered dataset
 */
export function exportStudentPdfReport(
  student: Student | null,
  sessions: Session[],
  tracks: Track[],
  filename = 'mentor-progress-report.pdf'
) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const trackMap = new Map(tracks.map((t) => [t.id, t.name]));

  // Document Title Header
  doc.setFontSize(18);
  doc.setTextColor(30, 41, 59); // slate-800
  doc.text('MENTOR PROGRESS REPORT', 14, 16);

  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`Generated on: ${new Date().toLocaleDateString('en-US', { dateStyle: 'full' })}`, 14, 22);

  let startY = 28;

  // Header Details Box for Student Info
  if (student) {
    doc.setDrawColor(226, 232, 240);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, 25, 269, 24, 2, 2, 'FD');

    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);

    doc.text(`Student Name: ${student.studentName}`, 18, 32);
    doc.text(`Student ID: ${student.studentId}`, 18, 38);
    doc.text(`Domain / Track: ${student.domain}`, 18, 44);

    doc.text(`Email: ${student.email || 'N/A'}`, 110, 32);
    doc.text(`Phone: ${student.phone || 'N/A'}`, 110, 38);
    doc.text(`Batch: ${student.batch || 'N/A'}`, 110, 44);

    doc.text(`Joining Date: ${formatDateDisplay(student.joiningDate)}`, 200, 32);
    doc.text(`Student Status: ${student.status}`, 200, 38);

    const totalHours = (sessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0) / 60).toFixed(1);
    doc.text(`Total Sessions / Hours: ${sessions.length} sessions (${totalHours} hrs)`, 200, 44);

    startY = 54;
  }

  // Detailed Sessions Table
  const tableData = sessions.map((s) => [
    formatDateDisplay(s.date),
    s.day.substring(0, 3),
    trackMap.get(s.trackId) || s.trackId,
    `${formatTimeDisplay(s.startTime)} - ${formatTimeDisplay(s.endTime)}`,
    s.durationText,
    s.sessionStatus || s.classStatus,
    s.attendance || 'Present',
    s.topicsTaught || '—',
    s.taskAssignment || '—',
    s.assignmentStatus || '—',
    s.progressLevel || '—',
    s.remarks || '—',
  ]);

  autoTable(doc, {
    startY: startY,
    head: [[
      'Date',
      'Day',
      'Track',
      'Time',
      'Duration',
      'Status',
      'Attendance',
      'Topics Covered',
      'Assignment',
      'Task Status',
      'Progress',
      'Remarks',
    ]],
    body: tableData,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 20 },
      1: { cellWidth: 12 },
      2: { cellWidth: 22 },
      3: { cellWidth: 28 },
      4: { cellWidth: 16 },
      5: { cellWidth: 20 },
      6: { cellWidth: 20 },
      7: { cellWidth: 40 },
      8: { cellWidth: 35 },
      9: { cellWidth: 20 },
      10: { cellWidth: 22 },
      11: { cellWidth: 24 },
    },
  });

  doc.save(filename);
}

/**
 * Export JSON Backup File
 */
export function exportToJsonBackup(backupData: BackupData) {
  const jsonString = JSON.stringify(backupData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
  const dateTag = new Date().toISOString().slice(0, 10);
  triggerDownload(blob, `mentor-log-backup-${dateTag}.json`);
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
