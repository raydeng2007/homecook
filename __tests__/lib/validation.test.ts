import {
  validateEmail,
  validatePassword,
  validatePasswordMatch,
  validateName,
} from '@/lib/validation';

describe('validateEmail', () => {
  it('returns null for a valid email', () => {
    expect(validateEmail('user@example.com')).toBeNull();
  });
  it('returns null for email with plus tag', () => {
    expect(validateEmail('user+tag@example.co.uk')).toBeNull();
  });
  it('returns null for subdomain email', () => {
    expect(validateEmail('user@sub.domain.com')).toBeNull();
  });
  it('returns null for email with surrounding whitespace (trims before check)', () => {
    expect(validateEmail('  user@example.com  ')).toBeNull();
  });
  it('returns error for empty string', () => {
    expect(validateEmail('')).toBe('Email is required');
  });
  it('returns error for whitespace-only string', () => {
    expect(validateEmail('   ')).toBe('Email is required');
  });
  it('returns error for missing @', () => {
    expect(validateEmail('notanemail')).toBe('Please enter a valid email address');
  });
  it('returns error for missing TLD', () => {
    expect(validateEmail('user@domain')).toBe('Please enter a valid email address');
  });
  it('returns error for missing local part', () => {
    expect(validateEmail('@domain.com')).toBe('Please enter a valid email address');
  });
});

describe('validatePassword', () => {
  it('returns null for a valid password (>= 8 chars)', () => {
    expect(validatePassword('exactly8')).toBeNull();
  });
  it('returns null for a long password', () => {
    expect(validatePassword('longpassword123')).toBeNull();
  });
  it('returns error for empty string', () => {
    expect(validatePassword('')).toBe('Password is required');
  });
  it('returns error for password shorter than 8 chars', () => {
    expect(validatePassword('1234567')).toBe('Password must be at least 8 characters');
  });
  it('returns error for 1-char password', () => {
    expect(validatePassword('x')).toBe('Password must be at least 8 characters');
  });
});

describe('validatePasswordMatch', () => {
  it('returns null when passwords match', () => {
    expect(validatePasswordMatch('pass123', 'pass123')).toBeNull();
  });
  it('returns error when confirmPassword is empty', () => {
    expect(validatePasswordMatch('pass', '')).toBe('Please confirm your password');
  });
  it('returns error when passwords do not match', () => {
    expect(validatePasswordMatch('pass123', 'different')).toBe('Passwords do not match');
  });
  it('returns error when confirmPassword is empty even if password is empty', () => {
    expect(validatePasswordMatch('', '')).toBe('Please confirm your password');
  });
  it('is case-sensitive (Pass123 vs pass123)', () => {
    expect(validatePasswordMatch('Pass123', 'pass123')).toBe('Passwords do not match');
  });
});

describe('validateName', () => {
  it('returns null for empty string (name is optional)', () => {
    expect(validateName('')).toBeNull();
  });
  it('returns null for whitespace-only string (optional)', () => {
    expect(validateName('   ')).toBeNull();
  });
  it('returns null for valid 2-char name', () => {
    expect(validateName('Al')).toBeNull();
  });
  it('returns null for normal name', () => {
    expect(validateName('Alice')).toBeNull();
  });
  it('returns error for 1-char name', () => {
    expect(validateName('A')).toBe('Name must be at least 2 characters');
  });
  it('returns error for 1-char name with surrounding spaces', () => {
    expect(validateName(' A ')).toBe('Name must be at least 2 characters');
  });
});
