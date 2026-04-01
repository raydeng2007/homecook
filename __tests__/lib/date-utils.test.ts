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

describe('getWeekRange', () => {
  it('returns Monday as start for a Wednesday input', () => {
    const wednesday = new Date(2024, 0, 17); // Wed Jan 17
    const { start } = getWeekRange(wednesday);
    expect(formatDateKey(start)).toBe('2024-01-15'); // Mon Jan 15
  });

  it('returns Sunday as end for a Wednesday input', () => {
    const wednesday = new Date(2024, 0, 17); // Wed Jan 17
    const { end } = getWeekRange(wednesday);
    expect(formatDateKey(end)).toBe('2024-01-21'); // Sun Jan 21
  });

  it('handles Monday input (start of week — returns same Monday)', () => {
    const monday = new Date(2024, 0, 15); // Mon Jan 15
    const { start } = getWeekRange(monday);
    expect(formatDateKey(start)).toBe('2024-01-15');
  });

  it('handles Sunday input (rolls back to previous Monday)', () => {
    const sunday = new Date(2024, 0, 21); // Sun Jan 21
    const { start } = getWeekRange(sunday);
    expect(formatDateKey(start)).toBe('2024-01-15'); // Mon Jan 15
  });

  it('handles Saturday input', () => {
    const saturday = new Date(2024, 0, 20); // Sat Jan 20
    const { start, end } = getWeekRange(saturday);
    expect(formatDateKey(start)).toBe('2024-01-15');
    expect(formatDateKey(end)).toBe('2024-01-21');
  });

  it('start is always a Monday (getDay() === 1)', () => {
    const thursday = new Date(2024, 2, 7); // Thu Mar 7
    const { start } = getWeekRange(thursday);
    expect(start.getDay()).toBe(1);
  });

  it('end is always a Sunday (getDay() === 0)', () => {
    const thursday = new Date(2024, 2, 7); // Thu Mar 7
    const { end } = getWeekRange(thursday);
    expect(end.getDay()).toBe(0);
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
    const start = new Date(2024, 0, 15); // Jan 15
    const end = new Date(2024, 0, 21);   // Jan 21
    const label = formatWeekLabel(start, end);
    expect(label).toContain('Jan 15');
    expect(label).toContain('Jan 21');
  });

  it('contains the en-dash separator', () => {
    const start = new Date(2024, 0, 15);
    const end = new Date(2024, 0, 21);
    expect(formatWeekLabel(start, end)).toContain(' – ');
  });

  it('formats a cross-month week range', () => {
    const start = new Date(2024, 2, 28); // Mar 28
    const end = new Date(2024, 3, 3);    // Apr 3
    const label = formatWeekLabel(start, end);
    expect(label).toContain('Mar');
    expect(label).toContain('Apr');
  });

  it('returns a non-empty string', () => {
    const start = new Date(2024, 5, 3); // Jun 3
    const end = new Date(2024, 5, 9);   // Jun 9
    expect(formatWeekLabel(start, end).length).toBeGreaterThan(0);
  });
});
