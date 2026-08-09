import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createTempRepoDir, cleanupTempDir, cloneRepository } from './git-service.js';

test('createTempRepoDir creates a unique directory inside temp', async () => {
  const jobId = 'test-job-uuid-1234';
  const tempDir = await createTempRepoDir(jobId);

  const matchesTemp = tempDir.includes(os.tmpdir()) || tempDir.includes('devflow-tmp');
  assert.ok(matchesTemp);
  assert.ok(fs.existsSync(tempDir));

  // Clean up
  await cleanupTempDir(tempDir);
  assert.equal(fs.existsSync(tempDir), false);
});

test('cloneRepository rejects URLs with embedded credentials', async () => {
  const invalidUrl = 'https://username:secret-token@github.com/owner/repo';
  const targetDir = path.join(os.tmpdir(), 'devflow-test-cred-rejection');

  await assert.rejects(
    async () => {
      await cloneRepository(invalidUrl, targetDir);
    },
    {
      message: 'REPOSITORY_URL_CONTAINS_CREDENTIALS',
    }
  );
});
