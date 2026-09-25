const DAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export function getTodayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calculates day name from YYYY-MM-DD
 */
export function calculateDay(dateString: string): string {
  if (!dateString) return '';
  // Split to avoid UTC timezone off-by-one shifts
  const parts = dateString.split('-');
  if (parts.length !== 3) return '';
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const d = new Date(year, month, day);
  return isNaN(d.getTime()) ? '' : DAYS[d.getDay()];
}

/**
 * Calculates duration in minutes and human readable string from start and end time (HH:mm)
 */
export function calculateDuration(startTime: string, endTime: string): {
  minutes: number;
  text: string;
} {
  if (!startTime || !endTime) {
    return { minutes: 0, text: '0m' };
  }

  const [startH, startM] = startTime.split(':').map((v) => parseInt(v, 10));
  const [endH, endM] = endTime.split(':').map((v) => parseInt(v, 10));

  if (
    isNaN(startH) ||
    isNaN(startM) ||
    isNaN(endH) ||
    isNaN(endM)
  ) {
    return { minutes: 0, text: '0m' };
  }

  let totalMinutes = endH * 60 + endM - (startH * 60 + startM);
  if (totalMinutes < 0) {
    // Crosses midnight, add 24 hours
    totalMinutes += 24 * 60;
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  let text = '';
  if (hours > 0 && minutes > 0) {
    text = `${hours}h ${minutes}m`;
  } else if (hours > 0) {
    text = `${hours}h`;
  } else {
    text = `${minutes}m`;
  }

  return { minutes: totalMinutes, text };
}

/**
 * Formats "2026-09-16" into "Sep 16, 2026"
 */
export function formatDateDisplay(dateString: string): string {
  if (!dateString) return '';
  const parts = dateString.split('-');
  if (parts.length !== 3) return dateString;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const d = new Date(year, month, day);
  if (isNaN(d.getTime())) return dateString;

  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Formats 12-hour or 24-hour time representation
 */
export function formatTimeDisplay(timeStr: string): string {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map((v) => parseInt(v, 10));
  if (isNaN(h) || isNaN(m)) return timeStr;
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  const minuteStr = String(m).padStart(2, '0');
  return `${hour12}:${minuteStr} ${period}`;
}

export function formatTotalHours(totalMinutes: number): string {
  const hours = totalMinutes / 60;
  if (Number.isInteger(hours)) {
    return `${hours} hrs`;
  }
  return `${hours.toFixed(1)} hrs`;
}

export function formatMentorHours(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = Math.round(totalMinutes % 60);
  return `${hours}h ${minutes}m`;
}

/**
 * Check if a YYYY-MM-DD date falls in the current calendar week (Monday to Sunday or Sunday to Saturday)
 */
export function isDateInThisWeek(dateString: string): boolean {
  if (!dateString) return false;
  const parts = dateString.split('-');
  if (parts.length !== 3) return false;
  const target = new Date(
    parseInt(parts[0], 10),
    parseInt(parts[1], 10) - 1,
    parseInt(parts[2], 10)
  );

  const now = new Date();
  const currentDay = now.getDay();
  // Monday as first day of week
  const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return target >= monday && target <= sunday;
}

/**
 * Check if a YYYY-MM-DD date falls in current calendar month
 */
export function isDateInThisMonth(dateString: string): boolean {
  if (!dateString) return false;
  const parts = dateString.split('-');
  if (parts.length !== 3) return false;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);

  const now = new Date();
  return year === now.getFullYear() && month === now.getMonth() + 1;
}
