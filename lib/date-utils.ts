/**
 * Shared date utility functions.
 * Extracted from: app/(app)/index.tsx, app/(app)/planner.tsx,
 *   app/(app)/shopping.tsx, components/MonthCalendarGrid.tsx,
 *   components/WeekCalendarStrip.tsx
 *
 * All functions use LOCAL timezone methods (getFullYear/getMonth/getDate)
 * not UTC methods, so dates match what users see on their device.
 */

/**
 * Format a Date as a YYYY-MM-DD key for Supabase date columns.
 */
export function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Get the Monday–Sunday range for the week containing baseDate.
 */
export function getWeekRange(baseDate: Date): { start: Date; end: Date } {
  const monday = new Date(baseDate);
  const day = monday.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  monday.setDate(monday.getDate() + diff);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  return { start: monday, end: sunday };
}

/**
 * Format a week range as a human-readable label, e.g. "Mar 24 – Mar 30".
 */
export function formatWeekLabel(start: Date, end: Date): string {
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  return `${start.toLocaleDateString('en-US', opts)} – ${end.toLocaleDateString('en-US', opts)}`;
}
