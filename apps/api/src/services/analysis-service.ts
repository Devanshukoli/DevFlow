import { getSupabaseAdminClient } from '../lib/supabase.js';
import { RepositoryIntelligence, AnalysisResult } from '@devflow/shared';

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

export interface DBAnalysisResultRow {
  id: string;
  job_id: string;
  repository_url: string;
  file_count: number;
  directory_count: number;
  total_bytes: number;
  extension_counts: Record<string, number>;
  detected_files: string[];
  detected_languages: any[];
  detected_frameworks: any[];
  detected_package_manager: string | null;
  detected_app_type: string;
  api_surface_hints: string[];
  architecture_hints: string[];
  summary: string;
  created_at: string;
  updated_at: string;
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

/**
 * Inserts or updates analysis result for a given job in Supabase.
 */
export async function saveAnalysisResult(
  jobId: string,
  repositoryUrl: string,
  intelligence: RepositoryIntelligence
): Promise<AnalysisResult> {
  const supabase = getSupabaseAdminClient();

  const payload = {
    job_id: jobId,
    repository_url: repositoryUrl,
    file_count: intelligence.fileCount,
    directory_count: intelligence.directoryCount,
    total_bytes: intelligence.totalBytes,
    extension_counts: intelligence.extensionCounts,
    detected_files: intelligence.detectedFiles,
    detected_languages: intelligence.detectedLanguages,
    detected_frameworks: intelligence.detectedFrameworks,
    detected_package_manager: intelligence.detectedPackageManager,
    detected_app_type: intelligence.detectedAppType,
    api_surface_hints: intelligence.apiSurfaceHints,
    architecture_hints: intelligence.architectureHints,
    summary: intelligence.summary,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('analysis_results')
    .upsert(payload, { onConflict: 'job_id' })
    .select('*')
    .single();

  if (error || !data) {
    console.error(`Failed to save analysis result for job ${jobId}:`, error);
    throw new Error('ANALYSIS_RESULT_SAVE_FAILED');
  }

  const row = data as DBAnalysisResultRow;

  return {
    id: row.id,
    jobId: row.job_id,
    repositoryUrl: row.repository_url,
    fileCount: row.file_count,
    directoryCount: row.directory_count,
    totalBytes: Number(row.total_bytes),
    extensionCounts: row.extension_counts,
    detectedFiles: row.detected_files,
    detectedLanguages: row.detected_languages,
    detectedFrameworks: row.detected_frameworks,
    detectedPackageManager: row.detected_package_manager,
    detectedAppType: row.detected_app_type,
    apiSurfaceHints: row.api_surface_hints,
    architectureHints: row.architecture_hints,
    summary: row.summary,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Fetches analysis result row from Supabase by job_id.
 */
export async function getAnalysisResultByJobId(jobId: string): Promise<AnalysisResult | null> {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(jobId)) {
    return null;
  }

  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase
    .from('analysis_results')
    .select('*')
    .eq('job_id', jobId)
    .maybeSingle();

  if (error) {
    console.error(`Error fetching analysis result for job ${jobId} from Supabase:`, error);
    throw new Error('ANALYSIS_RESULT_FETCH_FAILED');
  }

  if (!data) return null;

  const row = data as DBAnalysisResultRow;

  return {
    id: row.id,
    jobId: row.job_id,
    repositoryUrl: row.repository_url,
    fileCount: row.file_count,
    directoryCount: row.directory_count,
    totalBytes: Number(row.total_bytes),
    extensionCounts: row.extension_counts,
    detectedFiles: row.detected_files,
    detectedLanguages: row.detected_languages,
    detectedFrameworks: row.detected_frameworks,
    detectedPackageManager: row.detected_package_manager,
    detectedAppType: row.detected_app_type,
    apiSurfaceHints: row.api_surface_hints,
    architectureHints: row.architecture_hints,
    summary: row.summary,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

