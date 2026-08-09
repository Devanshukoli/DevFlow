import { getSupabaseAdminClient } from '../lib/supabase.js';

export interface DBAnalysisJobRow {
  id: string;
  repository_url: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  progress: number;
  current_stage: string | null;
  error_message: string | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}

/**
 * Validates a given input to ensure it is a valid GitHub repository URL.
 * Accepts: https://github.com/<owner>/<repository> (with optional trailing slash)
 * Returns the sanitized URL or null if invalid.
 */
export function validateGithubRepositoryUrl(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  const trimmed = input.trim();
  if (!trimmed) return null;

  const githubRegex = /^https:\/\/github\.com\/([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)\/?$/i;
  const match = trimmed.match(githubRegex);

  if (!match) return null;

  const owner = match[1];
  const repo = match[2];

  // Prevent dot-only or empty segments
  if (owner === '.' || owner === '..' || repo === '.' || repo === '..') {
    return null;
  }

  return `https://github.com/${owner}/${repo}`;
}

/**
 * Inserts a new analysis job row into Supabase.
 */
export async function createAnalysisJob(repositoryUrl: string): Promise<DBAnalysisJobRow> {
  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase
    .from('analysis_jobs')
    .insert({
      repository_url: repositoryUrl,
      status: 'queued',
      progress: 0,
      current_stage: null,
    })
    .select('*')
    .single();

  if (error || !data) {
    console.error('Failed to insert analysis job into Supabase:', error);
    throw new Error('ANALYSIS_JOB_CREATION_FAILED');
  }

  return data as DBAnalysisJobRow;
}

/**
 * Fetches an analysis job row from Supabase by UUID.
 */
export async function getAnalysisJobById(jobId: string): Promise<DBAnalysisJobRow | null> {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(jobId)) {
    return null;
  }

  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase
    .from('analysis_jobs')
    .select('*')
    .eq('id', jobId)
    .maybeSingle();

  if (error) {
    console.error(`Error fetching analysis job ${jobId} from Supabase:`, error);
    throw new Error('ANALYSIS_JOB_FETCH_FAILED');
  }

  return data as DBAnalysisJobRow | null;
}
