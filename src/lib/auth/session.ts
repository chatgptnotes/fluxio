import { cookies } from 'next/headers';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateSessionToken } from './password';
import { buildSessionUser, type SessionUser } from './permissions';

const SESSION_COOKIE_NAME = 'flownexus_session';
const SESSION_DURATION_MINUTES = 30; // Session expires after 30 minutes of inactivity

export interface Session {
  token: string;
  user: SessionUser;
  expiresAt: Date;
}

/**
 * Create a new session for a user
 */
export async function createSession(userId: string): Promise<Session | null> {
  const supabase = createAdminClient();
  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MINUTES * 60 * 1000);

  // Get user data
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .eq('is_active', true)
    .single();

  if (userError || !user) {
    console.error('Error fetching user for session:', userError);
    return null;
  }

  // Store session in database
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: sessionError } = await (supabase as any).from('user_sessions').insert({
    user_id: userId,
    session_token: token,
    expires_at: expiresAt.toISOString(),
  });

  if (sessionError) {
    console.error('Error creating session:', sessionError);
    return null;
  }

  // Update last login
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from('users')
    .update({ last_login: new Date().toISOString() })
    .eq('id', userId);

  // Set session cookie (no expires = deleted when browser closes)
  const cookieStore = cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    // No 'expires' or 'maxAge' = session cookie (deleted when browser closes)
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sessionUser = await buildSessionUser(user as any);

  return {
    token,
    user: sessionUser,
    expiresAt,
  };
}

/**
 * Get the current session from cookies
 */
export async function getSession(): Promise<Session | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const supabase = createAdminClient();

  // Get session from database
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: session, error: sessionError } = await (supabase as any)
    .from('user_sessions')
    .select('*, users(*)')
    .eq('session_token', token)
    .gt('expires_at', new Date().toISOString())
    .single();

  if (sessionError || !session) {
    // Invalid or expired session, clear cookie
    cookieStore.delete(SESSION_COOKIE_NAME);
    return null;
  }

  const user = session.users as {
    id: string;
    username: string;
    email: string;
    full_name: string;
    role: 'admin' | 'operator' | 'viewer';
    is_superadmin: boolean;
    company_id: string | null;
    permissions: Record<string, unknown>;
    is_active: boolean;
  };

  if (!user || !user.is_active) {
    cookieStore.delete(SESSION_COOKIE_NAME);
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sessionUser = await buildSessionUser(user as any);

  return {
    token,
    user: sessionUser,
    expiresAt: new Date(session.expires_at),
  };
}

/**
 * Get current user from session
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await getSession();
  return session?.user || null;
}

/**
 * Destroy the current session
 */
export async function destroySession(): Promise<void> {
  const cookieStore = cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    const supabase = createAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('user_sessions').delete().eq('session_token', token);
    cookieStore.delete(SESSION_COOKIE_NAME);
  }
}

/**
 * Refresh the current session (extend expiry)
 */
export async function refreshSession(): Promise<Session | null> {
  const session = await getSession();
  if (!session) return null;

  const supabase = createAdminClient();
  const newExpiresAt = new Date(Date.now() + SESSION_DURATION_MINUTES * 60 * 1000);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('user_sessions')
    .update({ expires_at: newExpiresAt.toISOString() })
    .eq('session_token', session.token);

  if (error) {
    console.error('Error refreshing session:', error);
    return session;
  }

  // Update cookie (session cookie - no expires)
  const cookieStore = cookies();
  cookieStore.set(SESSION_COOKIE_NAME, session.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });

  return {
    ...session,
    expiresAt: newExpiresAt,
  };
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return session !== null;
}

/**
 * Require authentication, redirect to login if not authenticated
 */
export async function requireAuth(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) {
    throw new Error('Authentication required');
  }
  return session.user;
}
