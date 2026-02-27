export function validateEmail(email: string): string | null {
  const trimmed = email.trim();

  if (!trimmed) {
    return 'Email is required';
  }

  // Basic email regex - checks for something@something.something
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    return 'Please enter a valid email address';
  }

  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) {
    return 'Password is required';
  }

  if (password.length < 8) {
    return 'Password must be at least 8 characters';
  }

  return null;
}

export function validatePasswordMatch(
  password: string,
  confirmPassword: string
): string | null {
  if (!confirmPassword) {
    return 'Please confirm your password';
  }

  if (password !== confirmPassword) {
    return 'Passwords do not match';
  }

  return null;
}

export function validateName(name: string): string | null {
  const trimmed = name.trim();

  // Name is optional, but if provided must be at least 2 characters
  if (trimmed && trimmed.length < 2) {
    return 'Name must be at least 2 characters';
  }

  return null;
}
