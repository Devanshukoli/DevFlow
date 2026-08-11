import { AuthUser, customHashPassword } from '@devflow/shared';
import { getSupabaseAdminClient } from '../lib/supabase.js';

interface StoredUser {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  avatar: string;
  created_at: string;
}

// In-memory fallback user and session store for local/offline environments
const inMemoryUsers = new Map<string, StoredUser>(); // email -> StoredUser
const inMemorySessions = new Map<string, string>(); // sessionToken -> userId

function isSupabaseConfigured(): boolean {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return false;
  if (url.includes('your-project.supabase.co') || key.includes('your-service-role-key')) return false;
  return true;
}

export async function registerUser(emailInput: string, passwordInput: string): Promise<{ user: AuthUser; sessionToken: string }> {
  const email = emailInput.trim().toLowerCase();
  
  if (!email || !email.includes('@') || !email.includes('.')) {
    throw { code: 'INVALID_EMAIL', message: 'Please enter a valid email address.' };
  }

  if (!passwordInput || passwordInput.length < 8) {
    throw { code: 'PASSWORD_TOO_SHORT', message: 'Password must be at least 8 characters long.' };
  }

  // 1. Check if email already registered
  let existingUser: StoredUser | null = null;

  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseAdminClient();
      const { data } = await supabase
        .from('devflow_users')
        .select('*')
        .eq('email', email)
        .maybeSingle();

      if (data) {
        existingUser = data as StoredUser;
      }
    } catch {
      // If table doesn't exist yet, check in-memory
      existingUser = inMemoryUsers.get(email) || null;
    }
  } else {
    existingUser = inMemoryUsers.get(email) || null;
  }

  if (existingUser) {
    throw { code: 'email_already_registered', message: 'Email is already registered' };
  }

  // 2. Hash password with custom hashing algorithm
  const passwordHash = await customHashPassword(passwordInput, email);

  const name = email.split('@')[0];
  const avatar = `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(email)}`;
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();

  const newUser: StoredUser = {
    id,
    email,
    password_hash: passwordHash,
    name,
    avatar,
    created_at: createdAt,
  };

  // 3. Save user to database or in-memory fallback
  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseAdminClient();
      await supabase.from('devflow_users').insert({
        id,
        email,
        password_hash: passwordHash,
        name,
        avatar,
        created_at: createdAt,
      });
    } catch (err) {
      console.warn('Failed to insert user into Supabase table devflow_users, falling back to memory:', err);
      inMemoryUsers.set(email, newUser);
    }
  } else {
    inMemoryUsers.set(email, newUser);
  }

  // 4. Create session
  const sessionToken = crypto.randomUUID();
  inMemorySessions.set(sessionToken, id);

  const authUser: AuthUser = {
    id,
    email,
    name,
    avatar,
    createdAt,
  };

  return { user: authUser, sessionToken };
}

export async function loginUser(emailInput: string, passwordInput: string): Promise<{ user: AuthUser; sessionToken: string }> {
  const email = emailInput.trim().toLowerCase();

  let user: StoredUser | null = null;

  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseAdminClient();
      const { data } = await supabase
        .from('devflow_users')
        .select('*')
        .eq('email', email)
        .maybeSingle();

      if (data) {
        user = data as StoredUser;
      } else {
        user = inMemoryUsers.get(email) || null;
      }
    } catch {
      user = inMemoryUsers.get(email) || null;
    }
  } else {
    user = inMemoryUsers.get(email) || null;
  }

  if (!user) {
    // Security basic: Generic wrong credentials error (don't leak whether email vs password is wrong)
    throw { code: 'invalid_credentials', message: 'Invalid email or password' };
  }

  // Verify custom hashed password
  const expectedHash = await customHashPassword(passwordInput, email);
  if (user.password_hash !== expectedHash) {
    throw { code: 'invalid_credentials', message: 'Invalid email or password' };
  }

  // Create new session token
  const sessionToken = crypto.randomUUID();
  inMemorySessions.set(sessionToken, user.id);

  const authUser: AuthUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    avatar: user.avatar,
    createdAt: user.created_at,
  };

  return { user: authUser, sessionToken };
}

export async function getUserBySessionToken(sessionToken: string): Promise<AuthUser | null> {
  if (!sessionToken) return null;

  const userId = inMemorySessions.get(sessionToken);
  if (!userId) return null;

  // Find user
  for (const user of inMemoryUsers.values()) {
    if (user.id === userId) {
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        createdAt: user.created_at,
      };
    }
  }

  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseAdminClient();
      const { data } = await supabase
        .from('devflow_users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (data) {
        return {
          id: data.id,
          email: data.email,
          name: data.name,
          avatar: data.avatar,
          createdAt: data.created_at,
        };
      }
    } catch {
      return null;
    }
  }

  return null;
}

export function invalidateSessionToken(sessionToken: string): void {
  if (sessionToken) {
    inMemorySessions.delete(sessionToken);
  }
}
