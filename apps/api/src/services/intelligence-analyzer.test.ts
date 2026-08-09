import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {
  detectLanguages,
  detectPackageManager,
  detectFrameworks,
  detectAppType,
  detectApiSurfaceHints,
  detectArchitectureHints,
  generateSummary,
  analyzeRepositoryIntelligence,
} from './intelligence-analyzer.js';
import { RepositoryMetadata } from './repo-inspector.js';

test('detectLanguages calculates and ranks languages based on file extensions', () => {
  const extensionCounts = {
    '.ts': 10,
    '.tsx': 5,
    '.js': 2,
    '.json': 3,
  };

  const languages = detectLanguages(extensionCounts, 20);

  assert.equal(languages.length, 2);
  assert.equal(languages[0].name, 'TypeScript');
  assert.equal(languages[0].confidence, 'high');
  assert.equal(languages[1].name, 'JavaScript');
});

test('detectPackageManager identifies correct package manager from lockfiles', () => {
  assert.equal(detectPackageManager(['pnpm-lock.yaml', 'package.json']), 'pnpm');
  assert.equal(detectPackageManager(['package-lock.json', 'package.json']), 'npm');
  assert.equal(detectPackageManager(['yarn.lock', 'package.json']), 'yarn');
  assert.equal(detectPackageManager(['bun.lockb', 'package.json']), 'bun');
  assert.equal(detectPackageManager(['Cargo.lock']), 'cargo');
  assert.equal(detectPackageManager(['go.mod']), 'go modules');
  assert.equal(detectPackageManager(['requirements.txt']), 'pip');
  assert.equal(detectPackageManager(['README.md']), null);
});

test('detectFrameworks detects frameworks from package.json dependencies and config files', () => {
  const pkgData = {
    dependencies: {
      react: '^18.0.0',
      express: '^4.18.0',
    },
    devDependencies: {
      vite: '^5.0.0',
    },
  };

  const frameworks = detectFrameworks(pkgData, ['package.json', 'vite.config.ts']);

  const names = frameworks.map((f) => f.name);
  assert.ok(names.includes('React'));
  assert.ok(names.includes('Express'));
  assert.ok(names.includes('Vite'));
});

test('detectAppType classifies repository structure deterministically', () => {
  // Monorepo
  assert.equal(
    detectAppType(null, ['apps', 'packages'], [], ['package.json']),
    'monorepo'
  );

  // Full-stack
  assert.equal(
    detectAppType(
      { dependencies: { next: '^14.0.0' } },
      ['src'],
      [{ name: 'Next.js', confidence: 'high', category: 'fullstack' }],
      ['next.config.mjs']
    ),
    'full-stack app'
  );

  // Backend API
  assert.equal(
    detectAppType(
      { dependencies: { express: '^4.18.0' } },
      ['src', 'routes', 'controllers'],
      [{ name: 'Express', confidence: 'high', category: 'backend' }],
      ['package.json']
    ),
    'backend API'
  );

  // Frontend app
  assert.equal(
    detectAppType(
      { dependencies: { react: '^18.0.0' } },
      ['src'],
      [{ name: 'React', confidence: 'high', category: 'frontend' }],
      ['package.json']
    ),
    'frontend app'
  );
});

test('detectApiSurfaceHints generates relevant API surface hints', () => {
  const hints = detectApiSurfaceHints(
    ['routes', 'controllers'],
    ['package.json'],
    [{ name: 'Express', confidence: 'high', category: 'backend' }]
  );

  assert.ok(hints.some((h) => h.includes('Routes directory')));
  assert.ok(hints.some((h) => h.includes('Controllers directory')));
  assert.ok(hints.some((h) => h.includes('Express')));
});

test('detectArchitectureHints generates relevant architecture hints', () => {
  const hints = detectArchitectureHints(
    ['apps', 'packages'],
    ['Dockerfile', 'package.json'],
    'monorepo'
  );

  assert.ok(hints.some((h) => h.includes('Monorepo workspace layout')));
  assert.ok(hints.some((h) => h.includes('Containerized deployment')));
});

test('generateSummary builds concise factual sentence', () => {
  const summary = generateSummary(
    [{ name: 'TypeScript', confidence: 'high' }],
    [{ name: 'React', confidence: 'high' }, { name: 'Vite', confidence: 'high' }],
    'pnpm',
    'frontend app'
  );

  assert.equal(
    summary,
    'TypeScript frontend app built with React and Vite. Managed with pnpm.'
  );
});

test('analyzeRepositoryIntelligence runs end-to-end on sample fixture repository', async () => {
  const fixturePath = path.resolve(process.cwd(), 'tests/fixtures/sample-repository');

  const metadata: RepositoryMetadata = {
    fileCount: 5,
    directoryCount: 1,
    totalBytes: 1024,
    extensionCounts: { '.ts': 2, '.json': 2, '.md': 1 },
    detectedFiles: ['README.md', 'package.json', 'tsconfig.json'],
  };

  const intelligence = await analyzeRepositoryIntelligence(fixturePath, metadata);

  assert.equal(intelligence.fileCount, 5);
  assert.equal(intelligence.directoryCount, 1);
  assert.equal(intelligence.detectedLanguages[0].name, 'TypeScript');
  assert.ok(intelligence.summary.length > 0);
  assert.ok(Array.isArray(intelligence.apiSurfaceHints));
  assert.ok(Array.isArray(intelligence.architectureHints));
});
