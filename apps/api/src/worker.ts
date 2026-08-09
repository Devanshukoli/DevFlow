try {
  process.loadEnvFile();
} catch {
  // Ignore if .env file is missing
}

import {
  claimNextQueuedJob,
  updateJobProgress,
  markJobCompleted,
  markJobFailed,
} from './services/worker-job-service.js';
import { createTempRepoDir, cloneRepository, cleanupTempDir } from './services/git-service.js';
import { inspectRepository } from './services/repo-inspector.js';
import { analyzeRepositoryIntelligence } from './services/intelligence-analyzer.js';
import {
  DBAnalysisJobRow,
  saveAnalysisResult,
  isSupabaseConfigured,
} from './services/analysis-service.js';
import { getSupabaseAdminClient } from './lib/supabase.js';

let isShuttingDown = false;
let isProcessingJob = false;

/**
 * Verifies Supabase configuration and tests database connectivity.
 */
export async function verifyWorkerEnvironment(): Promise<boolean> {
  console.log('[worker] DevFlow analysis worker started');

  if (!isSupabaseConfigured()) {
    console.log('[worker] Supabase configuration loaded (in-memory mode)');
    return true;
  }

  console.log('[worker] Supabase configuration loaded');

  try {
    const supabase = getSupabaseAdminClient();
    const { error } = await supabase.from('analysis_jobs').select('id').limit(1);

    if (error) {
      const sanitizedError = (error.message || 'Database query error').replace(
        /\/[\w.-]+\/[\w.-]+/g,
        '[redacted-path]'
      );
      console.error(`[worker] Supabase connection failed: ${sanitizedError}`);
      return false;
    }

    console.log('[worker] Supabase connection verified');
    return true;
  } catch (err: any) {
    const sanitizedError = (err?.message || 'Connection exception').replace(
      /\/[\w.-]+\/[\w.-]+/g,
      '[redacted-path]'
    );
    console.error(`[worker] Supabase connection failed: ${sanitizedError}`);
    return false;
  }
}

/**
 * Executes full analysis lifecycle on a claimed job.
 */
export async function processJob(job: DBAnalysisJobRow): Promise<void> {
  console.log(`[worker] claimed job ${job.id}`);

  let tempDir: string | null = null;
  let currentProgress = 5;

  try {
    // Stage 1: Preparing repository (5%)
    await updateJobProgress(job.id, 5, 'Preparing repository');
    tempDir = await createTempRepoDir(job.id);
    console.log(`[worker] preparing repository ${job.id}`);

    // Stage 2: Cloning repository (20%)
    currentProgress = 20;
    await updateJobProgress(job.id, 20, 'Cloning repository');
    console.log(`[worker] cloning repository ${job.id}`);
    await cloneRepository(job.repository_url, tempDir, 120000);

    // Stage 3: Repository cloned (35%)
    currentProgress = 35;
    await updateJobProgress(job.id, 35, 'Repository cloned');
    console.log(`[worker] repository cloned ${job.id}`);

    // Stage 4: Inspecting repository (50%)
    currentProgress = 50;
    await updateJobProgress(job.id, 50, 'Inspecting repository');
    console.log(`[worker] inspecting repository ${job.id}`);

    // Stage 5: Collecting metadata (65%)
    currentProgress = 65;
    await updateJobProgress(job.id, 65, 'Collecting metadata');
    const metadata = await inspectRepository(tempDir);
    console.log(
      `[worker] metadata collected for ${job.id}: ${metadata.fileCount} files, ${metadata.directoryCount} dirs, ${metadata.totalBytes} bytes`
    );

    // Stage 6: Deriving repository intelligence (80%)
    currentProgress = 80;
    await updateJobProgress(job.id, 80, 'Deriving repository intelligence');
    console.log(`[worker] deriving repository intelligence ${job.id}`);
    const intelligence = await analyzeRepositoryIntelligence(tempDir, metadata);

    // Stage 7: Persisting analysis results (90%)
    currentProgress = 90;
    await updateJobProgress(job.id, 90, 'Persisting analysis results');
    console.log(`[worker] persisting analysis result ${job.id}`);
    await saveAnalysisResult(job.id, job.repository_url, intelligence);

    // Stage 8: Completed (100%)
    await markJobCompleted(job.id);
    console.log(`[worker] job completed ${job.id}`);
  } catch (err: any) {
    const errorMsg = err?.message || 'Unknown processing error';
    console.error(`[worker] job ${job.id} failed: ${errorMsg}`);
    await markJobFailed(job.id, errorMsg, currentProgress);
  } finally {
    if (tempDir) {
      await cleanupTempDir(tempDir);
      console.log(`[worker] cleaned up temporary directory for job ${job.id}`);
    }
  }
}

/**
 * Polling loop that continuously checks for and processes queued jobs.
 */
export async function runWorkerLoop(pollIntervalMs = 2000): Promise<void> {
  const isEnvOk = await verifyWorkerEnvironment();
  if (!isEnvOk) {
    console.error('[worker] Missing required environment configuration or database connection failed.');
  }

  console.log(`[worker] polling every ${pollIntervalMs}ms`);

  while (!isShuttingDown) {
    try {
      const job = await claimNextQueuedJob();

      if (!job) {
        await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
        continue;
      }

      isProcessingJob = true;
      await processJob(job);
      isProcessingJob = false;
    } catch (err) {
      isProcessingJob = false;
      console.error('[worker] unhandled exception in worker loop:', err);
      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    }
  }

  console.log('[worker] worker loop terminated cleanly.');
}

/**
 * Register signal listeners for graceful shutdown.
 */
function registerShutdownListeners() {
  const handleShutdown = (signal: string) => {
    console.log(`[worker] received ${signal}. Initiating graceful shutdown...`);
    isShuttingDown = true;

    if (!isProcessingJob) {
      console.log('[worker] worker is idle. Exiting now.');
      process.exit(0);
    } else {
      console.log('[worker] waiting for current active job to finish...');
    }
  };

  process.on('SIGINT', () => handleShutdown('SIGINT'));
  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
}

import { fileURLToPath } from 'url';
import path from 'path';

// Auto-run if executed directly as entrypoint
const currentFile = fileURLToPath(import.meta.url);
const invokedFile = process.argv[1] ? path.resolve(process.argv[1]) : '';
const isDirectExecution = 
  (invokedFile && invokedFile === path.resolve(currentFile)) || 
  process.argv[1]?.endsWith('worker.ts') || 
  process.argv[1]?.endsWith('worker.js') || 
  process.argv[1]?.endsWith('worker.cjs') ||
  process.env.DEVFLOW_RUN_WORKER === 'true';

if (isDirectExecution) {
  registerShutdownListeners();
  runWorkerLoop().catch((err) => {
    console.error('[worker] fatal worker process failure:', err);
    process.exit(1);
  });
}
