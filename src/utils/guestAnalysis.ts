import { getApiUrl } from './api';
import { addOrUpdateRecentScan } from './recentScans';

export interface GuestPendingAnalysis {
  jobId: string;
  repositoryUrl: string;
  repositoryName: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  languages?: string[];
  createdAt: string;
}

const GUEST_ANALYSIS_KEY = 'devflow_guest_pending_analysis';

export function getGuestPendingAnalysis(): GuestPendingAnalysis | null {
  try {
    const raw = localStorage.getItem(GUEST_ANALYSIS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && parsed.jobId && parsed.repositoryUrl) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function setGuestPendingAnalysis(data: {
  jobId: string;
  repositoryUrl: string;
  repositoryName?: string;
  status?: 'queued' | 'running' | 'completed' | 'failed';
  languages?: string[];
  createdAt?: string;
}): void {
  try {
    const repoName =
      data.repositoryName ||
      data.repositoryUrl
        .replace(/^https?:\/\/(www\.)?github\.com\//i, '')
        .replace(/\/$/, '');

    const record: GuestPendingAnalysis = {
      jobId: data.jobId,
      repositoryUrl: data.repositoryUrl,
      repositoryName: repoName,
      status: data.status || 'running',
      languages: data.languages || ['TypeScript'],
      createdAt: data.createdAt || new Date().toISOString(),
    };

    localStorage.setItem(GUEST_ANALYSIS_KEY, JSON.stringify(record));
  } catch {
    // Ignore quota errors
  }
}

export function clearGuestPendingAnalysis(): void {
  try {
    localStorage.removeItem(GUEST_ANALYSIS_KEY);
  } catch {
    // Ignore errors
  }
}

export async function claimGuestAnalysis(userId: string): Promise<boolean> {
  const pending = getGuestPendingAnalysis();
  if (!pending) return false;

  try {
    // 1. Add locally to recent scans for this user
    addOrUpdateRecentScan(
      {
        id: pending.jobId,
        url: pending.repositoryUrl,
        name: pending.repositoryName,
        status: pending.status,
        languages: pending.languages || ['TypeScript'],
        date: new Date(pending.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      },
      userId
    );

    // 2. Call server API endpoint to associate analysis with user in database
    await fetch(getApiUrl('/api/users/claim-analysis'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jobId: pending.jobId,
        repositoryUrl: pending.repositoryUrl,
        status: pending.status,
        languages: pending.languages || ['TypeScript'],
      }),
    });

    // 3. Clear guest pending storage
    clearGuestPendingAnalysis();
    return true;
  } catch (err) {
    console.error('[guestAnalysis] Failed to claim guest analysis:', err);
    clearGuestPendingAnalysis();
    return false;
  }
}
