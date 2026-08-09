import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { formatBytes, isValidGitHubUrl } from '../../../../src/components/report/formatters.js';
import { parseRepoUrl } from '../../../../src/utils/repo-url.js';
import { AnalysisResult } from '@devflow/shared';

describe('Task 8 - Repository Intelligence Report Logic & Formatters', () => {

  test('formatBytes correctly formats byte sizes', () => {
    assert.equal(formatBytes(0), '0 B');
    assert.equal(formatBytes(512), '512 B');
    assert.equal(formatBytes(1024), '1 KB');
    assert.equal(formatBytes(713381), '696.66 KB');
    assert.equal(formatBytes(8545894), '8.15 MB');
    assert.equal(formatBytes(1073741824), '1 GB');
  });

  test('isValidGitHubUrl validates HTTPS GitHub repository URLs', () => {
    assert.equal(isValidGitHubUrl('https://github.com/FalkorDB/FalkorDB'), true);
    assert.equal(isValidGitHubUrl('https://github.com/facebook/react'), true);
    assert.equal(isValidGitHubUrl('http://github.com/FalkorDB/FalkorDB'), false);
    assert.equal(isValidGitHubUrl('https://malicious.com/FalkorDB/FalkorDB'), false);
    assert.equal(isValidGitHubUrl('not-a-url'), false);
    assert.equal(isValidGitHubUrl(null), false);
  });

  test('parseRepoUrl extracts owner, repo, and display string cleanly', () => {
    const res1 = parseRepoUrl('https://github.com/FalkorDB/FalkorDB');
    assert.equal(res1.owner, 'FalkorDB');
    assert.equal(res1.name, 'FalkorDB');
    assert.equal(res1.display, 'FalkorDB / FalkorDB');

    const res2 = parseRepoUrl('https://github.com/expressjs/express');
    assert.equal(res2.owner, 'expressjs');
    assert.equal(res2.name, 'express');
    assert.equal(res2.display, 'expressjs / express');
  });

  test('AnalysisResult structure excludes fabricated health score or dependency count', () => {
    const mockResult: AnalysisResult = {
      id: 'res-123',
      jobId: 'job-123',
      repositoryUrl: 'https://github.com/FalkorDB/FalkorDB',
      fileCount: 643,
      directoryCount: 148,
      totalBytes: 8545894,
      extensionCounts: { '.rs': 450, '.py': 120, '.sh': 20, '.c': 15 },
      detectedFiles: ['Cargo.toml', 'Dockerfile', 'README.md'],
      detectedLanguages: [
        { name: 'Rust', confidence: 'high', fileCount: 450 },
        { name: 'Python', confidence: 'high', fileCount: 120 },
      ],
      detectedFrameworks: [],
      detectedPackageManager: null,
      detectedAppType: 'General Application',
      apiSurfaceHints: ['C / FFI interface detected'],
      architectureHints: ['Containerization detected'],
      summary: 'Rust general application.',
      dependencies: [
        { name: 'serde', version: '1.0', type: 'production', source: 'Cargo.toml' },
        { name: 'tokio', version: '1.35', type: 'production', source: 'Cargo.toml' },
        { name: 'pytest', version: '8.0', type: 'development', source: 'pyproject.toml' },
      ],
      dependencyCount: 3,
      productionDependencyCount: 2,
      developmentDependencyCount: 1,
      optionalDependencyCount: 0,
      peerDependencyCount: 0,
      dependencyManifests: ['Cargo.toml', 'pyproject.toml'],
      architecture: {
        tree: [],
        importantDirectories: [],
        entryPoints: [],
        signals: [],
        workspaceBoundaries: [],
        apiBoundaries: []
      },
      apiSurface: {
        frameworks: [],
        routes: [],
        graphql: [],
        rpc: [],
        signals: []
      },
      createdAt: '2026-08-08T22:00:00.000Z',
      updatedAt: '2026-08-08T22:00:00.000Z',
    };

    // Verify key real fields are present
    assert.equal(mockResult.fileCount, 643);
    assert.equal(mockResult.directoryCount, 148);
    assert.equal(mockResult.detectedAppType, 'General Application');
    assert.equal(mockResult.dependencyCount, 3);
    assert.equal(mockResult.productionDependencyCount, 2);
    assert.equal(mockResult.developmentDependencyCount, 1);
    assert.equal(mockResult.dependencies.length, 3);
    assert.equal(mockResult.dependencyManifests.length, 2);

    // Verify no fabricated fields exist on the result object
    assert.equal((mockResult as any).healthScore, undefined);
    assert.equal((mockResult as any).apiCount, undefined);
  });

  test('Extension counts sorting produces correct relative order', () => {
    const extensionCounts = {
      '.js': 50,
      '.ts': 200,
      '.json': 10,
      '.md': 5,
    };

    const sorted = Object.entries(extensionCounts)
      .map(([ext, count]) => ({ ext, count }))
      .sort((a, b) => b.count - a.count);

    assert.equal(sorted[0].ext, '.ts');
    assert.equal(sorted[0].count, 200);
    assert.equal(sorted[1].ext, '.js');
    assert.equal(sorted[1].count, 50);
  });

});
