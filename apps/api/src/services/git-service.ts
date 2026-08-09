import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

/**
 * Creates a unique, safe temporary directory path for an analysis job.
 */
export async function createTempRepoDir(jobId: string): Promise<string> {
  const sanitizedJobId = jobId.replace(/[^a-zA-Z0-9-]/g, '');
  const tempBaseDir = path.join(os.tmpdir(), 'devflow-jobs');
  const jobDir = path.join(tempBaseDir, sanitizedJobId);

  await fs.promises.mkdir(jobDir, { recursive: true });
  return jobDir;
}

/**
 * Safely removes a temporary directory created for a job.
 * Ensures the target path is strictly within the temporary directory bounds.
 */
export async function cleanupTempDir(dirPath: string): Promise<void> {
  if (!dirPath) return;

  const resolvedPath = path.resolve(dirPath);
  const tempBaseDir = path.resolve(os.tmpdir());

  // Security guard: Ensure target directory is inside system temp directory
  if (!resolvedPath.startsWith(tempBaseDir)) {
    console.error(`Refusing to clean up directory outside tmp bounds: ${dirPath}`);
    return;
  }

  try {
    await fs.promises.rm(resolvedPath, { recursive: true, force: true });
  } catch (err) {
    console.error(`Failed to cleanup temp dir ${dirPath}:`, err);
  }
}

/**
 * Safely executes `git clone --depth 1` without shell execution or interpolation.
 */
export async function cloneRepository(
  repositoryUrl: string,
  targetDir: string,
  timeoutMs = 120000
): Promise<void> {
  // Reject URLs with embedded credentials (e.g. https://user:pass@github.com)
  if (/@/.test(repositoryUrl)) {
    throw new Error('REPOSITORY_URL_CONTAINS_CREDENTIALS');
  }

  return new Promise<void>((resolve, reject) => {
    let processKilled = false;

    const child = spawn('git', ['clone', '--depth', '1', repositoryUrl, targetDir], {
      shell: false,
      env: {
        ...process.env,
        GIT_TERMINAL_PROMPT: '0', // Prevent git from waiting for password prompts
      },
    });

    let stderrBuffer = '';

    child.stderr?.on('data', (data) => {
      stderrBuffer += data.toString();
    });

    const timer = setTimeout(() => {
      processKilled = true;
      child.kill('SIGTERM');
      setTimeout(() => {
        if (!child.killed) child.kill('SIGKILL');
      }, 2000);
      reject(new Error('REPOSITORY_CLONE_TIMEOUT'));
    }, timeoutMs);

    child.on('error', (err) => {
      clearTimeout(timer);
      if (processKilled) return;
      reject(new Error(`REPOSITORY_CLONE_SPAWN_FAILED: ${err.message}`));
    });

    child.on('close', (code) => {
      clearTimeout(timer);
      if (processKilled) return;

      if (code === 0) {
        resolve();
      } else {
        // Sanitize error message to prevent leaking system details
        const sanitizedErr = stderrBuffer
          .replace(/https?:\/\/[^@]+@/g, 'https://***@')
          .slice(0, 300)
          .trim();

        reject(
          new Error(
            `REPOSITORY_CLONE_FAILED: Git exited with code ${code}.${
              sanitizedErr ? ` Details: ${sanitizedErr}` : ''
            }`
          )
        );
      }
    });
  });
}
