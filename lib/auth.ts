import { supabase } from './supabase';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';

WebBrowser.maybeCompleteAuthSession();

const redirectTo = makeRedirectUri();

// Log the redirect URL so you can add it to Supabase
console.log('[Auth] Redirect URI:', redirectTo);

export async function signInWithGoogle() {
  console.log('[Auth] Starting Google sign-in, redirectTo:', redirectTo);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      skipBrowserRedirect: true,
    },
  });

  if (error) {
    console.error('[Auth] OAuth error:', error);
    throw error;
  }

  console.log('[Auth] OAuth URL:', data?.url);

  if (data?.url) {
    try {
      console.log('[Auth] Opening browser...');
      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        redirectTo,
        { showInRecents: true }
      );
      console.log('[Auth] Browser result:', JSON.stringify(result));

      if (result.type === 'success' && result.url) {
        console.log('[Auth] Redirect URL:', result.url);
        await createSessionFromUrl(result.url);
      } else if (result.type === 'cancel') {
        console.log('[Auth] User cancelled');
      } else if (result.type === 'dismiss') {
        console.log('[Auth] Browser dismissed');
      }
    } catch (browserError) {
      console.error('[Auth] Browser error:', browserError);
      throw browserError;
    }
  } else {
    console.warn('[Auth] No URL returned from signInWithOAuth');
  }
}

async function createSessionFromUrl(url: string) {
  console.log('[Auth] Parsing URL:', url);
  const parsedUrl = new URL(url);
  console.log('[Auth] URL hash:', parsedUrl.hash);
  console.log('[Auth] URL search:', parsedUrl.search);

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

  console.log('[Auth] access_token found:', !!access_token);
  console.log('[Auth] refresh_token found:', !!refresh_token);

  if (access_token && refresh_token) {
    const { data, error } = await supabase.auth.setSession({
      access_token,
      refresh_token,
    });
    console.log('[Auth] setSession result:', { data: !!data?.session, error });
    if (error) throw error;
  } else {
    // Check for error in URL
    const error = params.get('error');
    const errorDescription = params.get('error_description');
    if (error) {
      console.error('[Auth] OAuth error in URL:', error, errorDescription);
      throw new Error(errorDescription || error);
    }
    console.warn('[Auth] No tokens found in redirect URL');
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
  console.log('[Auth] signUpWithEmail called for:', email.trim().toLowerCase());

  const { data, error } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: {
      data: { full_name: fullName?.trim() },
    },
  });

  console.log('[Auth] signUp response - error:', error?.message, 'user:', !!data.user);

  if (error) {
    return { success: false, error: mapAuthError(error.message) };
  }

  // Supabase returns user with empty identities array if email confirmation is required
  const needsEmailConfirmation = data.user?.identities?.length === 0;
  console.log('[Auth] needsEmailConfirmation:', needsEmailConfirmation);

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
