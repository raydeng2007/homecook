import { formatDateKey, getWeekRange, formatWeekLabel } from '@/lib/date-utils';

// ── formatDateKey ────────────────────────────────────────────────────────
// IMPORTANT: Always use new Date(year, month, day) — local-time constructor.
// Do NOT use new Date('YYYY-MM-DD') which parses as UTC midnight and
// would produce wrong results in UTC-offset environments (CI).

describe('formatDateKey', () => {
  it('formats a date as YYYY-MM-DD', () => {
    const date = new Date(2024, 0, 15); // Jan 15, 2024
    expect(formatDateKey(date)).toBe('2024-01-15');
  });

  it('zero-pads single-digit month', () => {
    const date = new Date(2024, 2, 15); // Mar 15
    expect(formatDateKey(date)).toBe('2024-03-15');
  });

  it('zero-pads single-digit day', () => {
    const date = new Date(2024, 0, 5); // Jan 5
    expect(formatDateKey(date)).toBe('2024-01-05');
  });

  it('zero-pads both month and day', () => {
    const date = new Date(2024, 2, 5); // Mar 5
    expect(formatDateKey(date)).toBe('2024-03-05');
  });

  it('handles December correctly', () => {
    const date = new Date(2024, 11, 31); // Dec 31
    expect(formatDateKey(date)).toBe('2024-12-31');
  });

  it('handles year 2000', () => {
    const date = new Date(2000, 0, 1); // Jan 1, 2000
    expect(formatDateKey(date)).toBe('2000-01-01');
  });

  it('returns a string with format YYYY-MM-DD (length 10)', () => {
    const date = new Date(2024, 5, 15); // Jun 15
    expect(formatDateKey(date)).toHaveLength(10);
  });
});

// ── getWeekRange ──────────────────────────────────────────────────────────
// Week runs Sunday–Saturday

describe('getWeekRange', () => {
  it('returns Sunday as start for a Wednesday input', () => {
    const wednesday = new Date(2024, 0, 17); // Wed Jan 17
    const { start } = getWeekRange(wednesday);
    expect(formatDateKey(start)).toBe('2024-01-14'); // Sun Jan 14
  });

  it('returns Saturday as end for a Wednesday input', () => {
    const wednesday = new Date(2024, 0, 17); // Wed Jan 17
    const { end } = getWeekRange(wednesday);
    expect(formatDateKey(end)).toBe('2024-01-20'); // Sat Jan 20
  });

  it('handles Sunday input (start of week — returns same Sunday)', () => {
    const sunday = new Date(2024, 0, 14); // Sun Jan 14
    const { start } = getWeekRange(sunday);
    expect(formatDateKey(start)).toBe('2024-01-14');
  });

  it('handles Saturday input (end of week — returns previous Sunday)', () => {
    const saturday = new Date(2024, 0, 20); // Sat Jan 20
    const { start, end } = getWeekRange(saturday);
    expect(formatDateKey(start)).toBe('2024-01-14'); // Sun Jan 14
    expect(formatDateKey(end)).toBe('2024-01-20');   // Sat Jan 20
  });

  it('handles Monday input', () => {
    const monday = new Date(2024, 0, 15); // Mon Jan 15
    const { start, end } = getWeekRange(monday);
    expect(formatDateKey(start)).toBe('2024-01-14'); // Sun Jan 14
    expect(formatDateKey(end)).toBe('2024-01-20');   // Sat Jan 20
  });

  it('start is always a Sunday (getDay() === 0)', () => {
    const thursday = new Date(2024, 2, 7); // Thu Mar 7
    const { start } = getWeekRange(thursday);
    expect(start.getDay()).toBe(0);
  });

  it('end is always a Saturday (getDay() === 6)', () => {
    const thursday = new Date(2024, 2, 7); // Thu Mar 7
    const { end } = getWeekRange(thursday);
    expect(end.getDay()).toBe(6);
  });

  it('end is exactly 6 days after start', () => {
    const wednesday = new Date(2024, 0, 17);
    const { start, end } = getWeekRange(wednesday);
    const diff = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    expect(diff).toBe(6);
  });

  it('does not mutate the input date', () => {
    const input = new Date(2024, 0, 17);
    const inputTime = input.getTime();
    getWeekRange(input);
    expect(input.getTime()).toBe(inputTime);
  });
});

// ── formatWeekLabel ───────────────────────────────────────────────────────

describe('formatWeekLabel', () => {
  it('formats a same-month week range', () => {
    const start = new Date(2024, 0, 14); // Sun Jan 14
    const end = new Date(2024, 0, 20);   // Sat Jan 20
    const label = formatWeekLabel(start, end);
    expect(label).toContain('Jan 14');
    expect(label).toContain('Jan 20');
  });

  it('contains the en-dash separator', () => {
    const start = new Date(2024, 0, 14);
    const end = new Date(2024, 0, 20);
    expect(formatWeekLabel(start, end)).toContain(' – ');
  });

  it('formats a cross-month week range', () => {
    const start = new Date(2024, 2, 31); // Sun Mar 31
    const end = new Date(2024, 3, 6);    // Sat Apr 6
    const label = formatWeekLabel(start, end);
    expect(label).toContain('Mar');
    expect(label).toContain('Apr');
  });

  it('returns a non-empty string', () => {
    const start = new Date(2024, 5, 2); // Sun Jun 2
    const end = new Date(2024, 5, 8);   // Sat Jun 8
    expect(formatWeekLabel(start, end).length).toBeGreaterThan(0);
  });
});
