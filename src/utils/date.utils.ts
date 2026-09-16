import moment from 'moment';

/**
 * Formats a date value into 'DD/MM/YYYY' string.
 *
 * @param date - A Date object, ISO string, timestamp, or any moment-parseable value.
 * @returns Formatted date string e.g. "16/09/2026", or empty string if the value is invalid.
 *
 * @example
 *   formatDate(new Date())           // "16/09/2026"
 *   formatDate('2026-09-16')         // "16/09/2026"
 *   formatDate(1726473600000)        // "16/09/2026"
 *   formatDate(user.createdAt)       // "16/09/2026"
 */
export function formatDate(date: Date | string | number | undefined | null): string {
  if (!date) return '';
  const m = moment(date);
  return m.isValid() ? m.format('DD/MM/YYYY') : '';
}

/**
 * Formats a date value into 'DD/MM/YYYY HH:mm' string (with time).
 *
 * @example
 *   formatDateTime(new Date())  // "16/09/2026 20:11"
 */
export function formatDateTime(date: Date | string | number | undefined | null): string {
  if (!date) return '';
  const m = moment(date);
  return m.isValid() ? m.format('DD/MM/YYYY HH:mm') : '';
}
