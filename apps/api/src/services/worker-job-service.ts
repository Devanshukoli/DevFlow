import { getSupabaseAdminClient } from '../lib/supabase.js';
import { DBAnalysisJobRow, isSupabaseConfigured, inMemoryJobs } from './analysis-service.js';

/**
 * Finds a queued job and atomically attempts to claim it by changing status to 'running'.
 * Returns the claimed job or null if no queued job exists or another worker claimed it first.
 */
export async function claimNextQueuedJob(): Promise<DBAnalysisJobRow | null> {
  if (!isSupabaseConfigured()) {
    const queuedJob = Array.from(inMemoryJobs.values()).find((j) => j.status === 'queued');
    if (!queuedJob) return null;

    queuedJob.status = 'running';
    queuedJob.started_at = new Date().toISOString();
    queuedJob.progress = 5;
    queuedJob.current_stage = 'Preparing repository';
    inMemoryJobs.set(queuedJob.id, queuedJob);
    return queuedJob;
  }

  const supabase = getSupabaseAdminClient();

  // 1. Fetch oldest queued job candidate
  const { data: candidates, error: fetchErr } = await supabase
    .from('analysis_jobs')
    .select('*')
    .eq('status', 'queued')
    .order('created_at', { ascending: true })
    .limit(1);

  if (fetchErr || !candidates || candidates.length === 0) {
    return null;
  }

  const candidate = candidates[0] as DBAnalysisJobRow;

  // 2. Conditional claim update to prevent race conditions
  const { data: claimedJob, error: updateErr } = await supabase
    .from('analysis_jobs')
    .update({
      status: 'running',
      started_at: new Date().toISOString(),
      progress: 5,
      current_stage: 'Preparing repository',
    })
    .eq('id', candidate.id)
    .eq('status', 'queued')
    .select('*')
    .maybeSingle();

  if (updateErr || !claimedJob) {
    return null;
  }

  return claimedJob as DBAnalysisJobRow;
}

/**
 * Updates stage name and progress percentage for a running job.
 */
export async function updateJobProgress(
  jobId: string,
  progress: number,
  currentStage: string
): Promise<void> {
  if (!isSupabaseConfigured()) {
    const job = inMemoryJobs.get(jobId);
    if (job) {
      job.progress = progress;
      job.current_stage = currentStage;
    }
    return;
  }

  const supabase = getSupabaseAdminClient();

  const { error } = await supabase
    .from('analysis_jobs')
    .update({
      progress,
      current_stage: currentStage,
    })
    .eq('id', jobId);

  if (error) {
    console.error(`Failed to update progress for job ${jobId}:`, error);
  }
}

/**
 * Marks job as completed with 100% progress and completion timestamp.
 */
export async function markJobCompleted(jobId: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    const job = inMemoryJobs.get(jobId);
    if (job) {
      job.status = 'completed';
      job.progress = 100;
      job.current_stage = 'Completed';
      job.completed_at = new Date().toISOString();
      job.error_message = null;
    }
    return;
  }

  const supabase = getSupabaseAdminClient();

  const { error } = await supabase
    .from('analysis_jobs')
    .update({
      status: 'completed',
      progress: 100,
      current_stage: 'Completed',
      completed_at: new Date().toISOString(),
      error_message: null,
    })
    .eq('id', jobId);

  if (error) {
    console.error(`Failed to mark job ${jobId} as completed:`, error);
  }
}

/**
 * Marks job as failed with sanitized error message and appropriate progress state.
 */
export async function markJobFailed(
  jobId: string,
  errorMessage: string,
  failureProgress = 10
): Promise<void> {
  // Sanitize error message to exclude internal system details/paths
  const sanitized = errorMessage
    .replace(/\/[\w.-]+\/[\w.-]+/g, '[redacted-path]')
    .slice(0, 500);

  if (!isSupabaseConfigured()) {
    const job = inMemoryJobs.get(jobId);
    if (job) {
      job.status = 'failed';
      job.current_stage = 'Analysis failed';
      job.error_message = sanitized || 'Analysis execution encountered an error.';
      job.progress = failureProgress;
    }
    return;
  }

  const supabase = getSupabaseAdminClient();

  const { error } = await supabase
    .from('analysis_jobs')
    .update({
      status: 'failed',
      current_stage: 'Analysis failed',
      error_message: sanitized || 'Analysis execution encountered an error.',
      progress: failureProgress,
    })
    .eq('id', jobId);

  if (error) {
    console.error(`Failed to mark job ${jobId} as failed:`, error);
  }
}
