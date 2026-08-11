import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { AuthUser, customHashPassword } from '@devflow/shared';
import { getSupabaseAdminClient } from '../lib/supabase.js';

export interface StoredUser {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  avatar: string;
  created_at: string;
}

export interface UserAnalysisRecord {
  id: string;
  user_id: string;
  job_id: string;
  repository_url: string;
  repository_name: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  languages: string[];
  created_at: string;
  completed_at?: string | null;
}

interface DBFileStructure {
  users: Record<string, StoredUser>; // email -> StoredUser
  sessions: Record<string, string>; // sessionToken -> userId
  analyses: UserAnalysisRecord[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'devflow_db.json');

// In-memory cache loaded from disk
let dbState: DBFileStructure = {
  users: {},
  sessions: {},
  analyses: [],
};

function loadDbFromFile(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      dbState = {
        users: parsed.users || {},
        sessions: parsed.sessions || {},
        analyses: Array.isArray(parsed.analyses) ? parsed.analyses : [],
      };
    }
  } catch (err) {
    console.warn('[user-service] Could not load local db file, using empty state:', err);
  }
}

function saveDbToFile(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(dbState, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[user-service] Failed to write db file:', err);
  }
}

// Initial load on module startup
loadDbFromFile();

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

  // 1. Check if user exists in memory/disk store
  let existingUser = dbState.users[email] || null;

  if (!existingUser && isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseAdminClient();
      const { data } = await supabase
        .from('devflow_users')
        .select('*')
        .eq('email', email)
        .maybeSingle();

      if (data) {
        existingUser = data as StoredUser;
        dbState.users[email] = existingUser;
        saveDbToFile();
      }
    } catch {
      // Supabase query error - fallback
    }
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

  // 3. Save to disk database
  dbState.users[email] = newUser;

  // 4. Create session
  const sessionToken = crypto.randomUUID();
  dbState.sessions[sessionToken] = id;
  saveDbToFile();

  // 5. Optionally sync to Supabase
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
      console.warn('Notice: Supabase insert fallback to local disk DB:', err);
    }
  }

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

  let user: StoredUser | null = dbState.users[email] || null;

  if (!user && isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseAdminClient();
      const { data } = await supabase
        .from('devflow_users')
        .select('*')
        .eq('email', email)
        .maybeSingle();

      if (data) {
        user = data as StoredUser;
        dbState.users[email] = user;
        saveDbToFile();
      }
    } catch {
      // Fallback to local
    }
  }

  if (!user) {
    throw { code: 'invalid_credentials', message: 'Invalid email or password' };
  }

  // Verify custom hashed password
  const expectedHash = await customHashPassword(passwordInput, email);
  if (user.password_hash !== expectedHash) {
    throw { code: 'invalid_credentials', message: 'Invalid email or password' };
  }

  // Create new session token
  const sessionToken = crypto.randomUUID();
  dbState.sessions[sessionToken] = user.id;
  saveDbToFile();

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

  const userId = dbState.sessions[sessionToken];
  if (!userId) return null;

  for (const user of Object.values(dbState.users)) {
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
        const u = data as StoredUser;
        dbState.users[u.email] = u;
        saveDbToFile();
        return {
          id: u.id,
          email: u.email,
          name: u.name,
          avatar: u.avatar,
          createdAt: u.created_at,
        };
      }
    } catch {
      return null;
    }
  }

  return null;
}

export function invalidateSessionToken(sessionToken: string): void {
  if (sessionToken && dbState.sessions[sessionToken]) {
    delete dbState.sessions[sessionToken];
    saveDbToFile();
  }
}

export function recordUserAnalysis(
  userId: string,
  jobId: string,
  repositoryUrl: string,
  status: 'queued' | 'running' | 'completed' | 'failed' = 'running',
  languages: string[] = ['TypeScript']
): UserAnalysisRecord {
  const repoName = repositoryUrl
    .replace(/^https?:\/\/(www\.)?github\.com\//i, '')
    .replace(/\/$/, '');

  const existingIndex = dbState.analyses.findIndex((a) => a.user_id === userId && a.job_id === jobId);

  const now = new Date().toISOString();
  let record: UserAnalysisRecord;

  if (existingIndex >= 0) {
    const prev = dbState.analyses[existingIndex];
    record = {
      ...prev,
      status,
      languages: languages && languages.length > 0 && languages[0] !== 'Analyzing...' ? languages : prev.languages,
      completed_at: status === 'completed' || status === 'failed' ? now : prev.completed_at,
    };
    dbState.analyses[existingIndex] = record;
  } else {
    record = {
      id: crypto.randomUUID(),
      user_id: userId,
      job_id: jobId,
      repository_url: repositoryUrl,
      repository_name: repoName,
      status,
      languages,
      created_at: now,
      completed_at: status === 'completed' || status === 'failed' ? now : null,
    };
    dbState.analyses.unshift(record);
  }

  saveDbToFile();

  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseAdminClient();
      Promise.resolve(
        supabase.from('devflow_user_analyses').upsert({
          id: record.id,
          user_id: record.user_id,
          job_id: record.job_id,
          repository_url: record.repository_url,
          repository_name: record.repository_name,
          status: record.status,
          languages: record.languages,
          created_at: record.created_at,
          completed_at: record.completed_at,
        })
      ).catch(() => {});
    } catch {
      // Ignore error
    }
  }

  return record;
}

export function getUserAnalyses(userId: string): UserAnalysisRecord[] {
  if (!userId) return [];
  return dbState.analyses.filter((a) => a.user_id === userId);
}

