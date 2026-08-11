import { getApiUrl } from './api';

export interface RecentScan {
  id: string;
  name: string;
  url: string;
  languages: string[];
  status: 'queued' | 'running' | 'completed' | 'failed';
  date: string;
  timestamp: number;
  userId?: string;
}

const STORAGE_PREFIX = 'devflow_recent_scans_';

export function getRecentScans(userId?: string): RecentScan[] {
  if (!userId) return [];
  
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${userId}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function fetchUserAnalysesFromServer(): Promise<RecentScan[]> {
  try {
    const res = await fetch(getApiUrl('/api/users/me/analyses'), {
      headers: { 'Content-Type': 'application/json' },
    });

    if (res.ok) {
      const json = await res.json();
      if (json.ok && Array.isArray(json.data)) {
        return json.data.map((item: any) => ({
          id: item.job_id || item.id,
          name: item.repository_name || item.repository_url.replace(/^https?:\/\/(www\.)?github\.com\//i, '').replace(/\/$/, ''),
          url: item.repository_url,
          languages: Array.isArray(item.languages) && item.languages.length > 0 ? item.languages : ['TypeScript'],
          status: item.status || 'completed',
          date: item.created_at ? new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Recently',
          timestamp: item.created_at ? new Date(item.created_at).getTime() : Date.now(),
        }));
      }
    }
  } catch {
    // Ignore error
  }
  return [];
}

export function addOrUpdateRecentScan(
  scanData: {
    id: string;
    url: string;
    name?: string;
    languages?: string[];
    status?: 'queued' | 'running' | 'completed' | 'failed';
    date?: string;
    timestamp?: number;
  },
  userId?: string
): RecentScan[] {
  if (!userId) return [];

  const existing = getRecentScans(userId);
  const repoName =
    scanData.name ||
    scanData.url
      .replace(/^https?:\/\/(www\.)?github\.com\//i, '')
      .replace(/\/$/, '');

  const newScan: RecentScan = {
    id: scanData.id,
    name: repoName,
    url: scanData.url,
    languages: scanData.languages || ['TypeScript'],
    status: scanData.status || 'running',
    date: scanData.date || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    timestamp: scanData.timestamp || Date.now(),
    userId,
  };

  const existingIndex = existing.findIndex((s) => s.id === scanData.id);

  let updated: RecentScan[];
  if (existingIndex >= 0) {
    updated = [...existing];
    updated[existingIndex] = {
      ...updated[existingIndex],
      ...newScan,
      // Preserve languages if newScan didn't specify detailed ones
      languages:
        scanData.languages && scanData.languages.length > 0 && scanData.languages[0] !== 'Analyzing...'
          ? scanData.languages
          : updated[existingIndex].languages,
    };
  } else {
    updated = [newScan, ...existing];
  }

  try {
    localStorage.setItem(`${STORAGE_PREFIX}${userId}`, JSON.stringify(updated));
  } catch {
    // Ignore quota errors
  }

  return updated;
}
