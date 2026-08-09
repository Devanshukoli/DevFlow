import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { inspectRepository, isCommonProjectFile } from './repo-inspector.js';

test('isCommonProjectFile detects standard project config files', () => {
  assert.equal(isCommonProjectFile('package.json'), true);
  assert.equal(isCommonProjectFile('tsconfig.json'), true);
  assert.equal(isCommonProjectFile('vite.config.ts'), true);
  assert.equal(isCommonProjectFile('next.config.mjs'), true);
  assert.equal(isCommonProjectFile('random-file.txt'), false);
});

test('inspectRepository correctly analyzes sample fixture repository', async () => {
  const fixturePath = path.resolve(process.cwd(), 'tests/fixtures/sample-repository');

  const metadata = await inspectRepository(fixturePath);

  assert.equal(metadata.fileCount, 5); // package.json, README.md, tsconfig.json, src/index.ts, src/utils.ts
  assert.equal(metadata.directoryCount, 1); // src
  assert.ok(metadata.totalBytes > 0);

  // Extension counts
  assert.equal(metadata.extensionCounts['.json'], 2);
  assert.equal(metadata.extensionCounts['.md'], 1);
  assert.equal(metadata.extensionCounts['.ts'], 2);

  // Detected common files
  assert.deepEqual(metadata.detectedFiles, ['README.md', 'package.json', 'tsconfig.json']);
});
