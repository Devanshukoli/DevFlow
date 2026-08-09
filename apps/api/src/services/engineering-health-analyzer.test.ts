import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { analyzeEngineeringHealth } from './engineering-health-analyzer.js';
import { RepositoryDependency, RepositoryArchitecture, RepositoryApiSurface } from '@devflow/shared';

// Helper to create a temp fixture directory
async function createTempFixture(name: string): Promise<string> {
  const dir = path.join(os.tmpdir(), `devflow-test-${name}-${Math.random().toString(36).slice(2)}`);
  await fs.promises.mkdir(dir, { recursive: true });
  return dir;
}

// Helper to cleanup temp fixture directory
async function cleanupFixture(dir: string) {
  try {
    await fs.promises.rm(dir, { recursive: true, force: true });
  } catch {
    // Ignore cleanup failures
  }
}

// Default empty dependencies & architecture metadata mock for testing helper
const emptyDeps: RepositoryDependency[] = [];
const emptyArch: RepositoryArchitecture = {
  tree: [],
  importantDirectories: [],
  entryPoints: [],
  signals: [],
  workspaceBoundaries: [],
  apiBoundaries: []
};
const emptyApi: RepositoryApiSurface = {
  frameworks: [],
  routes: [],
  graphql: [],
  rpc: [],
  signals: []
};

test('Fixture 1: Healthy TypeScript backend has 100/100 score', async () => {
  const dir = await createTempFixture('healthy-backend');
  try {
    // Write required files
    await fs.promises.writeFile(path.join(dir, 'README.md'), '# Test Project');
    await fs.promises.writeFile(path.join(dir, '.gitignore'), 'node_modules/');
    await fs.promises.writeFile(path.join(dir, 'LICENSE'), 'MIT');
    await fs.promises.writeFile(path.join(dir, 'tsconfig.json'), '{}');
    await fs.promises.writeFile(path.join(dir, 'package-lock.json'), '{}');
    await fs.promises.writeFile(path.join(dir, 'Dockerfile'), 'FROM node');
    await fs.promises.mkdir(path.join(dir, '.github', 'workflows'), { recursive: true });
    await fs.promises.writeFile(path.join(dir, '.github', 'workflows', 'ci.yml'), 'name: CI');
    
    // Create a test file
    await fs.promises.mkdir(path.join(dir, 'src'), { recursive: true });
    await fs.promises.writeFile(path.join(dir, 'src', 'app.test.ts'), 'test("ok", () => {})');
    await fs.promises.writeFile(path.join(dir, 'src', 'server.ts'), 'console.log("running")');

    const pkgData = {
      devDependencies: {
        'vitest': '^1.0.0'
      }
    };

    const metadata = {
      fileCount: 8,
      directoryCount: 3,
      totalBytes: 500,
      extensionCounts: { '.ts': 2, '.md': 1, '.json': 2, '.yml': 1 },
      detectedFiles: ['package-lock.json', 'tsconfig.json', 'Dockerfile', 'README.md', '.gitignore']
    };

    const arch: RepositoryArchitecture = {
      ...emptyArch,
      entryPoints: [{ path: 'src/server.ts', type: 'file' }],
      importantDirectories: [{ path: 'src', name: 'src', classification: 'source', confidence: 'high' }],
      signals: [{ name: 'Layered backend', description: 'Separated services and controllers' }]
    };

    const health = await analyzeEngineeringHealth(dir, metadata, emptyDeps, arch, emptyApi, 'backend API', pkgData);

    assert.equal(health.score, 100);
    assert.equal(health.findings.length, 0);
    assert.ok(health.positiveSignals.some(s => s.name === 'Automated testing structure detected'));
    assert.ok(health.positiveSignals.some(s => s.name === 'README.md documentation detected'));
    assert.ok(health.positiveSignals.some(s => s.name === 'Dependency lockfile present'));
  } finally {
    await cleanupFixture(dir);
  }
});

test('Fixture 2: Poorly structured backend has low score and correct findings', async () => {
  const dir = await createTempFixture('poor-backend');
  try {
    // Write package.json so lockfile is expected
    await fs.promises.writeFile(path.join(dir, 'package.json'), '{"dependencies":{}}');

    // giant source file
    await fs.promises.mkdir(path.join(dir, 'src'), { recursive: true });
    const giantContent = Array(1200).fill('console.log("giant code line");').join('\n');
    await fs.promises.writeFile(path.join(dir, 'src', 'giant.ts'), giantContent);

    const pkgData = {
      dependencies: {}
    };

    const metadata = {
      fileCount: 12,
      directoryCount: 1,
      totalBytes: 25000,
      extensionCounts: { '.ts': 1 },
      detectedFiles: ['package.json']
    };

    const health = await analyzeEngineeringHealth(dir, metadata, emptyDeps, emptyArch, emptyApi, 'backend API', pkgData);

    assert.ok(health.score < 60, `Score was expected to be < 60, but was ${health.score}`);
    assert.ok(health.findings.some(f => f.id === 'missing-tests'));
    assert.ok(health.findings.some(f => f.id === 'missing-lockfile'));
    assert.ok(health.findings.some(f => f.id === 'missing-readme'));
    assert.ok(health.findings.some(f => f.id === 'large-source-files'));
  } finally {
    await cleanupFixture(dir);
  }
});

test('Fixture 3: CLI repository does not punish missing HTTP API', async () => {
  const dir = await createTempFixture('cli-app');
  try {
    await fs.promises.writeFile(path.join(dir, 'README.md'), '# CLI');
    await fs.promises.writeFile(path.join(dir, '.gitignore'), 'dist');
    await fs.promises.writeFile(path.join(dir, 'package-lock.json'), '{}');
    await fs.promises.writeFile(path.join(dir, 'index.ts'), 'console.log("cli")');

    const pkgData = {
      name: 'my-cli',
      bin: './index.ts'
    };

    const metadata = {
      fileCount: 4,
      directoryCount: 0,
      totalBytes: 300,
      extensionCounts: { '.ts': 1, '.md': 1, '.json': 1 },
      detectedFiles: ['package-lock.json', 'README.md', '.gitignore']
    };

    const arch: RepositoryArchitecture = {
      ...emptyArch,
      entryPoints: [{ path: 'index.ts', type: 'file' }]
    };

    const health = await analyzeEngineeringHealth(dir, metadata, emptyDeps, arch, emptyApi, 'CLI tool', pkgData);

    // API Structure dimension should be intact (5/5) since it is a CLI tool and not an API app
    const apiDim = health.dimensions.find(d => d.name === 'API Structure');
    assert.equal(apiDim?.score, 5);
    // Ensure no API-related risk is flagged
    assert.equal(health.findings.some(f => f.category === 'apiStructure'), false);
  } finally {
    await cleanupFixture(dir);
  }
});

test('Fixture 4: Frontend application detects proper frameworks', async () => {
  const dir = await createTempFixture('frontend');
  try {
    await fs.promises.writeFile(path.join(dir, 'README.md'), '# Frontend App');
    await fs.promises.writeFile(path.join(dir, '.gitignore'), 'node_modules');
    await fs.promises.writeFile(path.join(dir, 'package-lock.json'), '{}');
    await fs.promises.mkdir(path.join(dir, 'src', 'components'), { recursive: true });
    await fs.promises.writeFile(path.join(dir, 'src', 'components', 'Button.tsx'), 'export const Button = () => <button>Click</button>');

    const pkgData = {
      dependencies: {
        'react': '^18.0.0',
        'react-dom': '^18.0.0'
      }
    };

    const metadata = {
      fileCount: 4,
      directoryCount: 2,
      totalBytes: 400,
      extensionCounts: { '.tsx': 1, '.md': 1, '.json': 1 },
      detectedFiles: ['package-lock.json', 'README.md', '.gitignore']
    };

    const arch: RepositoryArchitecture = {
      ...emptyArch,
      importantDirectories: [{ path: 'src/components', name: 'components', classification: 'ui', confidence: 'high' }]
    };

    const health = await analyzeEngineeringHealth(dir, metadata, emptyDeps, arch, emptyApi, 'frontend app', pkgData);

    assert.ok(health.score > 70);
    assert.ok(health.positiveSignals.some(s => s.name === 'Consistent project layout'));
  } finally {
    await cleanupFixture(dir);
  }
});

test('Fixture 5: Monorepo detection works', async () => {
  const dir = await createTempFixture('monorepo');
  try {
    await fs.promises.mkdir(path.join(dir, 'apps', 'web'), { recursive: true });
    await fs.promises.mkdir(path.join(dir, 'packages', 'shared'), { recursive: true });
    await fs.promises.writeFile(path.join(dir, 'README.md'), '# Monorepo');

    const pkgData = {
      workspaces: ['apps/*', 'packages/*']
    };

    const metadata = {
      fileCount: 2,
      directoryCount: 4,
      totalBytes: 150,
      extensionCounts: { '.md': 1 },
      detectedFiles: ['README.md']
    };

    const health = await analyzeEngineeringHealth(dir, metadata, emptyDeps, emptyArch, emptyApi, 'monorepo', pkgData);

    assert.ok(health.positiveSignals.some(s => s.name === 'Consistent project layout'));
  } finally {
    await cleanupFixture(dir);
  }
});

test('Fixture 6: Security - Committed .env file triggers risk but content is NEVER exposed', async () => {
  const dir = await createTempFixture('env-secured');
  try {
    // Write committed .env containing sensitive secrets
    await fs.promises.writeFile(path.join(dir, '.env'), 'DATABASE_PASSWORD=secret1234567890\nGEMINI_API_KEY=AIzaSySecret');
    await fs.promises.writeFile(path.join(dir, 'README.md'), '# Secured project');

    const metadata = {
      fileCount: 2,
      directoryCount: 0,
      totalBytes: 200,
      extensionCounts: { '.md': 1 },
      detectedFiles: ['README.md']
    };

    const health = await analyzeEngineeringHealth(dir, metadata, emptyDeps, emptyArch, emptyApi, 'backend API', null);

    const finding = health.findings.find(f => f.id === 'committed-env-file');
    assert.ok(finding);
    assert.equal(finding.severity, 'high');
    assert.ok(finding.evidence.includes('.env'));

    // SECURITY CRITICAL ASSERTIONS:
    const stringified = JSON.stringify(health);
    assert.equal(stringified.includes('secret1234567890'), false, 'Secret database password must never be leaked!');
    assert.equal(stringified.includes('AIzaSySecret'), false, 'Secret API key must never be leaked!');
  } finally {
    await cleanupFixture(dir);
  }
});

test('Fixture 7: Security - Committed private key file triggers risk but content is NEVER exposed', async () => {
  const dir = await createTempFixture('private-key-secured');
  try {
    await fs.promises.writeFile(path.join(dir, 'id_rsa'), '-----BEGIN RSA PRIVATE KEY-----\nMIIEowIBAAKCAQEAsdfSecretContent...\n-----END RSA PRIVATE KEY-----');
    await fs.promises.writeFile(path.join(dir, 'README.md'), '# Secured private key');

    const metadata = {
      fileCount: 2,
      directoryCount: 0,
      totalBytes: 300,
      extensionCounts: { '.md': 1 },
      detectedFiles: ['README.md']
    };

    const health = await analyzeEngineeringHealth(dir, metadata, emptyDeps, emptyArch, emptyApi, 'backend API', null);

    const finding = health.findings.find(f => f.id === 'committed-private-key');
    assert.ok(finding);
    assert.equal(finding.severity, 'critical');
    assert.ok(finding.evidence.includes('id_rsa'));

    // SECURITY CRITICAL ASSERTIONS:
    const stringified = JSON.stringify(health);
    assert.equal(stringified.includes('MIIEowIBAAKCAQEAsdfSecretContent'), false, 'Private key content must never be leaked!');
  } finally {
    await cleanupFixture(dir);
  }
});

test('Fixture 8: Large source file is successfully handled and reported', async () => {
  const dir = await createTempFixture('large-file');
  try {
    await fs.promises.mkdir(path.join(dir, 'src'), { recursive: true });
    const largeContent = Array(1500).fill('const a = 1;').join('\n');
    await fs.promises.writeFile(path.join(dir, 'src', 'large.ts'), largeContent);

    const metadata = {
      fileCount: 1,
      directoryCount: 1,
      totalBytes: 30000,
      extensionCounts: { '.ts': 1 },
      detectedFiles: []
    };

    const health = await analyzeEngineeringHealth(dir, metadata, emptyDeps, emptyArch, emptyApi, 'backend API', null);

    const finding = health.findings.find(f => f.id === 'large-source-files');
    assert.ok(finding);
    assert.ok(finding.evidence[0].includes('src/large.ts'));
    assert.ok(finding.evidence[0].includes('1,500 lines'));
  } finally {
    await cleanupFixture(dir);
  }
});

test('Fixture 9: Generated directories are ignored and not scanned', async () => {
  const dir = await createTempFixture('ignored-dirs');
  try {
    // Create a node_modules directory which contains .env or huge files
    await fs.promises.mkdir(path.join(dir, 'node_modules', 'some-dep'), { recursive: true });
    await fs.promises.writeFile(path.join(dir, 'node_modules', 'some-dep', '.env'), 'PASSWORD=secret');
    await fs.promises.writeFile(path.join(dir, 'node_modules', 'some-dep', 'giant.ts'), Array(1500).fill('let x = 1;').join('\n'));
    await fs.promises.writeFile(path.join(dir, 'README.md'), '# Ignored testing');

    const metadata = {
      fileCount: 3,
      directoryCount: 2,
      totalBytes: 50000,
      extensionCounts: { '.ts': 1, '.md': 1 },
      detectedFiles: ['README.md']
    };

    const health = await analyzeEngineeringHealth(dir, metadata, emptyDeps, emptyArch, emptyApi, 'backend API', null);

    // .env and giant files in node_modules must be completely ignored
    assert.equal(health.findings.some(f => f.id === 'committed-env-file'), false);
    assert.equal(health.findings.some(f => f.id === 'large-source-files'), false);
    assert.equal(health.metrics.largeSourceFilesCount, 0);
  } finally {
    await cleanupFixture(dir);
  }
});

test('Fixture 10 & 11: CI & Docker detections are independent', async () => {
  const dir = await createTempFixture('ci-docker');
  try {
    await fs.promises.writeFile(path.join(dir, 'Dockerfile'), 'FROM alpine');
    await fs.promises.writeFile(path.join(dir, 'README.md'), '# Done');

    const metadata = {
      fileCount: 2,
      directoryCount: 0,
      totalBytes: 100,
      extensionCounts: { '.md': 1 },
      detectedFiles: ['Dockerfile', 'README.md']
    };

    const health = await analyzeEngineeringHealth(dir, metadata, emptyDeps, emptyArch, emptyApi, 'backend API', null);

    assert.ok(health.positiveSignals.some(s => s.name === 'Container deployment configuration detected'));
    assert.equal(health.positiveSignals.some(s => s.name === 'CI workflow detected'), false);
  } finally {
    await cleanupFixture(dir);
  }
});

test('Fixture 12: Scoring rules work consistently and deterministically', async () => {
  const dir = await createTempFixture('scoring-tests');
  try {
    await fs.promises.writeFile(path.join(dir, 'README.md'), '# Scoring');
    const metadata = {
      fileCount: 1,
      directoryCount: 0,
      totalBytes: 10,
      extensionCounts: { '.md': 1 },
      detectedFiles: ['README.md']
    };

    const health1 = await analyzeEngineeringHealth(dir, metadata, emptyDeps, emptyArch, emptyApi, 'backend API', null);
    const health2 = await analyzeEngineeringHealth(dir, metadata, emptyDeps, emptyArch, emptyApi, 'backend API', null);

    // Deterministic check
    assert.equal(health1.score, health2.score);
    assert.deepEqual(health1.findings, health2.findings);

    // Bounds check
    assert.ok(health1.score >= 0 && health1.score <= 100);
  } finally {
    await cleanupFixture(dir);
  }
});
