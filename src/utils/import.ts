import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { BackupData } from '../types';

export interface ImportPreviewRow {
  rowNumber: number;
  studentName: string;
  studentId?: string;
  trackName: string;
  date: string;
  startTime: string;
  endTime: string;
  classStatus: string;
  topicsTaught: string;
  taskAssignment?: string;
  remarks?: string;
  isValid: boolean;
  errorReason?: string;
  raw: Record<string, any>;
}

export interface ImportResult {
  fileType: 'json' | 'excel' | 'csv';
  validRows: ImportPreviewRow[];
  invalidRows: ImportPreviewRow[];
  backupData?: BackupData;
}

/**
 * Helper to normalize dates into YYYY-MM-DD
 */
export function normalizeImportDate(rawDate: any): string {
  if (!rawDate) return '';
  const str = String(rawDate).trim();
  if (str.match(/^\d{4}-\d{2}-\d{2}$/)) return str;

  const months: Record<string, string> = {
    jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
    jul: '07', aug: '08', sep: '09', sept: '09', oct: '10', nov: '11', dec: '12'
  };

  // e.g. 05-Aug-2026 or 16-sept-2026
  const ddmmyyyy = str.match(/^(\d{1,2})[-/]([a-zA-Z]{3,4})[-/](\d{4})$/);
  if (ddmmyyyy) {
    const day = ddmmyyyy[1].padStart(2, '0');
    const monStr = ddmmyyyy[2].toLowerCase();
    const month = months[monStr] || '01';
    const year = ddmmyyyy[3];
    return `${year}-${month}-${day}`;
  }

  // e.g. 2-Sep-2026
  const singleDayMatch = str.match(/^(\d{1,2})[-/]([a-zA-Z]+)[-/](\d{4})$/);
  if (singleDayMatch) {
    const day = singleDayMatch[1].padStart(2, '0');
    const monStr = singleDayMatch[2].toLowerCase();
    const month = months[monStr] || '01';
    const year = singleDayMatch[3];
    return `${year}-${month}-${day}`;
  }

  // Handle Excel serial date numbers
  if (!isNaN(Number(str)) && Number(str) > 30000 && Number(str) < 60000) {
    const dateObj = XLSX.SSF.parse_date_code(Number(str));
    if (dateObj) {
      const y = dateObj.y;
      const m = String(dateObj.m).padStart(2, '0');
      const d = String(dateObj.d).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
  }

  return str;
}

/**
 * Helper to normalize times into 24-hr HH:mm format
 */
export function normalizeImportTime(rawTime: any): string {
  if (!rawTime) return '';
  let str = String(rawTime).trim().toUpperCase();
  str = str.replace('.', ':');
  const match = str.match(/^(\d{1,2}):?(\d{2})?\s*(AM|PM)?$/);
  if (match) {
    let hours = parseInt(match[1], 10);
    const minutes = match[2] ? match[2] : '00';
    const ampm = match[3];

    if (ampm === 'PM' && hours < 12) hours += 12;
    if (ampm === 'AM' && hours === 12) hours = 0;

    return `${String(hours).padStart(2, '0')}:${minutes}`;
  }
  return str;
}

/**
 * Parse and validate JSON Backup file
 */
export async function parseJsonBackupFile(file: File): Promise<BackupData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text);
        if (!parsed || typeof parsed !== 'object') {
          throw new Error('Selected file does not contain a valid JSON object.');
        }
        if (!Array.isArray(parsed.sessions) || !Array.isArray(parsed.tracks)) {
          throw new Error('Invalid backup file structure: missing sessions or tracks array.');
        }
        resolve(parsed as BackupData);
      } catch (err: any) {
        reject(new Error(err.message || 'Failed to parse JSON backup file.'));
      }
    };
    reader.onerror = () => reject(new Error('File reading error.'));
    reader.readAsText(file);
  });
}

/**
 * Parse and validate CSV or Excel spreadsheet files for bulk session/student import
 */
export async function parseSpreadsheetImportFile(file: File): Promise<ImportResult> {
  const extension = file.name.split('.').pop()?.toLowerCase();

  let raw2DRows: any[][] = [];
  let rawObjects: Record<string, any>[] = [];

  if (extension === 'csv') {
    const text = await file.text();
    const parsed = Papa.parse<any[]>(text, { header: false, skipEmptyLines: false });
    raw2DRows = parsed.data;
    const objectParsed = Papa.parse<Record<string, any>>(text, { header: true, skipEmptyLines: true });
    rawObjects = objectParsed.data;
  } else if (extension === 'xlsx' || extension === 'xls') {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const sheetName = workbook.SheetNames.includes('Class Log') ? 'Class Log' : workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    raw2DRows = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1, raw: false });
    rawObjects = XLSX.utils.sheet_to_json<Record<string, any>>(sheet);
  } else {
    throw new Error('Unsupported file format. Please upload a .xlsx, .csv, or .json file.');
  }

  const validRows: ImportPreviewRow[] = [];
  const invalidRows: ImportPreviewRow[] = [];

  // Detect if spreadsheet matches Google Sheet multi-section log format
  const isGoogleSheetFormat = raw2DRows.some(
    (row) =>
      Array.isArray(row) &&
      row[0] === 'S.No' &&
      row[1] === 'Student Name' &&
      row[7] === 'Topics Taught'
  );

  if (isGoogleSheetFormat && raw2DRows.length > 0) {
    let currentStudentName = '';
    let defaultDomain = 'Full Stack Development';

    // Scan metadata at top of sheet if present
    for (let i = 0; i < Math.min(10, raw2DRows.length); i++) {
      const row = raw2DRows[i] || [];
      for (let j = 0; j < row.length; j++) {
        if (row[j] === 'Course' && row[j + 1]) {
          const courseVal = String(row[j + 1]).trim();
          if (courseVal.toUpperCase().includes('FULL STACK')) {
            defaultDomain = 'Full Stack Development';
          } else if (courseVal) {
            defaultDomain = courseVal;
          }
        }
      }
    }

    raw2DRows.forEach((row, index) => {
      const rowNumber = index + 1;
      if (!Array.isArray(row) || row.length === 0) return;

      // Skip header / title rows
      if (
        row[0] === 'S.No' ||
        row[1] === 'Student Name' ||
        row[0] === 'TRAINER CLASS & TRAINING LOG' ||
        row[0] === 'Trainer Name'
      ) {
        return;
      }

      const nameCell = row[1] ? String(row[1]).trim() : '';
      const dateCell = row[2] ? String(row[2]).trim() : '';
      const startTimeCell = row[4] ? String(row[4]).trim() : '';
      const endTimeCell = row[5] ? String(row[5]).trim() : '';
      const topicsCell = row[7] ? String(row[7]).trim() : '';
      const taskCell = row[8] ? String(row[8]).trim() : '';
      const statusCell = row[9] ? String(row[9]).trim() : '';
      const remarksCell = row[10] ? String(row[10]).trim() : '';

      if (nameCell && nameCell !== 'Student Name') {
        currentStudentName = nameCell;
      }

      const normalizedDate = normalizeImportDate(dateCell);
      if (!dateCell && !topicsCell && !taskCell) {
        return; // Empty filler row
      }

      let isValid = true;
      let errorReason = '';

      if (!currentStudentName) {
        isValid = false;
        errorReason = 'Missing student name';
      } else if (!normalizedDate || !normalizedDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
        isValid = false;
        errorReason = 'Invalid date format';
      }

      const startTime = normalizeImportTime(startTimeCell) || '18:30';
      const endTime = normalizeImportTime(endTimeCell) || '20:00';

      let classStatus = 'Completed';
      if (statusCell) {
        const lower = statusCell.toLowerCase();
        if (lower.includes('revision') || lower.includes('needs revision')) classStatus = 'Pending';
        else if (lower.includes('completed')) classStatus = 'Completed';
        else if (lower.includes('cancelled')) classStatus = 'Cancelled';
        else if (lower.includes('rescheduled')) classStatus = 'Rescheduled';
      } else if (!topicsCell && !taskCell) {
        classStatus = 'Pending';
      }

      const previewRow: ImportPreviewRow = {
        rowNumber,
        studentName: currentStudentName || 'Unknown Student',
        trackName: defaultDomain,
        date: normalizedDate || dateCell,
        startTime,
        endTime,
        classStatus,
        topicsTaught: topicsCell,
        taskAssignment: taskCell && taskCell !== 'NA' ? taskCell : '',
        remarks: remarksCell,
        isValid,
        errorReason: isValid ? undefined : errorReason,
        raw: { row },
      };

      if (isValid) {
        validRows.push(previewRow);
      } else {
        invalidRows.push(previewRow);
      }
    });
  } else {
    // Single table format fallback
    rawObjects.forEach((row, index) => {
      const rowNumber = index + 1;

      const studentName = (
        row['Student Name'] ||
        row['Student'] ||
        row['studentName'] ||
        row['name'] ||
        ''
      ).toString().trim();

      const studentId = (
        row['Student ID'] ||
        row['studentId'] ||
        ''
      ).toString().trim();

      const trackName = (
        row['Track'] ||
        row['Role'] ||
        row['Domain'] ||
        row['track'] ||
        'Full Stack Development'
      ).toString().trim();

      const dateRaw = (
        row['Date'] ||
        row['date'] ||
        new Date().toISOString().slice(0, 10)
      ).toString().trim();
      const date = normalizeImportDate(dateRaw);

      const startTime = normalizeImportTime(
        row['Start Time'] || row['startTime'] || '18:30'
      );

      const endTime = normalizeImportTime(
        row['End Time'] || row['endTime'] || '20:00'
      );

      const classStatus = (
        row['Session Status'] ||
        row['Status'] ||
        row['classStatus'] ||
        'Completed'
      ).toString().trim();

      const topicsTaught = (
        row['Topics Taught'] ||
        row['Topics'] ||
        row['topicsTaught'] ||
        ''
      ).toString().trim();

      const taskAssignment = (
        row['Task / Assignment Given'] ||
        row['Task Assignment'] ||
        row['Task'] ||
        ''
      ).toString().trim();

      const remarks = (row['Remarks'] || row['remarks'] || '').toString().trim();

      let isValid = true;
      let errorReason = '';

      if (!studentName) {
        isValid = false;
        errorReason = 'Missing student name';
      } else if (!date || !date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        isValid = false;
        errorReason = 'Invalid date format (must be YYYY-MM-DD)';
      }

      const previewRow: ImportPreviewRow = {
        rowNumber,
        studentName,
        studentId,
        trackName,
        date,
        startTime,
        endTime,
        classStatus,
        topicsTaught,
        taskAssignment: taskAssignment !== 'NA' ? taskAssignment : '',
        remarks,
        isValid,
        errorReason: isValid ? undefined : errorReason,
        raw: row,
      };

      if (isValid) {
        validRows.push(previewRow);
      } else {
        invalidRows.push(previewRow);
      }
    });
  }

  return {
    fileType: extension === 'csv' ? 'csv' : 'excel',
    validRows,
    invalidRows,
  };
}
