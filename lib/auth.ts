import { supabase } from './supabase';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';

WebBrowser.maybeCompleteAuthSession();

const redirectTo = makeRedirectUri();

export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      skipBrowserRedirect: true,
    },
  });

  if (error) throw error;

  if (data?.url) {
    const result = await WebBrowser.openAuthSessionAsync(
      data.url,
      redirectTo,
      { showInRecents: true }
    );

    if (result.type === 'success' && result.url) {
      await createSessionFromUrl(result.url);
    }
  }
}

async function createSessionFromUrl(url: string) {
  const parsedUrl = new URL(url);

  // Try hash first (implicit flow), then search params (PKCE flow)
  let params = new URLSearchParams(parsedUrl.hash.substring(1));
  let access_token = params.get('access_token');
  let refresh_token = params.get('refresh_token');

  // If not in hash, check query params
  if (!access_token) {
    params = new URLSearchParams(parsedUrl.search);
    access_token = params.get('access_token');
    refresh_token = params.get('refresh_token');
  }

  if (access_token && refresh_token) {
    const { error } = await supabase.auth.setSession({
      access_token,
      refresh_token,
    });
    if (error) throw error;
  } else {
    // Check for error in URL
    const error = params.get('error');
    const errorDescription = params.get('error_description');
    if (error) {
      throw new Error(errorDescription || error);
    }
  }
}

// ============================================================================
// Facebook OAuth
// ============================================================================

export async function signInWithFacebook() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'facebook',
    options: {
      redirectTo,
      skipBrowserRedirect: true,
    },
  });

  if (error) throw error;

  if (data?.url) {
    const result = await WebBrowser.openAuthSessionAsync(
      data.url,
      redirectTo,
      { showInRecents: true }
    );

    if (result.type === 'success' && result.url) {
      await createSessionFromUrl(result.url);
    }
  }
}

// ============================================================================
// Email/Password Auth
// ============================================================================

export type EmailAuthResult = {
  success: boolean;
  needsEmailConfirmation?: boolean;
  error?: string;
};

export async function signUpWithEmail(
  email: string,
  password: string,
  fullName?: string
): Promise<EmailAuthResult> {
  const { data, error } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: {
      data: { full_name: fullName?.trim() },
    },
  });

  if (error) {
    return { success: false, error: mapAuthError(error.message) };
  }

  // Supabase returns user with empty identities array if email confirmation is required
  const needsEmailConfirmation = data.user?.identities?.length === 0;

  return { success: true, needsEmailConfirmation };
}

export async function signInWithEmail(
  email: string,
  password: string
): Promise<EmailAuthResult> {
  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });

  if (error) {
    return { success: false, error: mapAuthError(error.message) };
  }

  return { success: true };
}

export async function resendConfirmationEmail(email: string): Promise<EmailAuthResult> {
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: email.trim().toLowerCase(),
  });

  if (error) {
    return { success: false, error: mapAuthError(error.message) };
  }

  return { success: true };
}

function mapAuthError(message: string): string {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes('invalid login credentials')) {
    return 'Invalid email or password';
  }
  if (lowerMessage.includes('email not confirmed')) {
    return 'Please confirm your email before signing in';
  }
  if (lowerMessage.includes('already registered') || lowerMessage.includes('already exists')) {
    return 'An account with this email already exists';
  }
  if (lowerMessage.includes('password') && lowerMessage.includes('least')) {
    return 'Password must be at least 6 characters';
  }
  if (lowerMessage.includes('rate limit') || lowerMessage.includes('too many')) {
    return 'Too many attempts. Please try again later';
  }
  if (lowerMessage.includes('network') || lowerMessage.includes('fetch')) {
    return 'Network error. Please check your connection';
  }

  return message;
}

// ============================================================================
// Sign Out
// ============================================================================

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
