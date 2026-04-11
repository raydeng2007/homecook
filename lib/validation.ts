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

export function validateRecipeTitle(title: string): string | null {
  const trimmed = title.trim();
  if (!trimmed) return 'Title is required';
  if (trimmed.length > 100) return 'Title must be 100 characters or less';
  return null;
}

export function validateRecipeDescription(description: string): string | null {
  const trimmed = description.trim();
  if (!trimmed) return 'Description is required';
  if (trimmed.length > 500) return 'Description must be 500 characters or less';
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
