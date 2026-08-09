import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { analyzeArchitecture, classifyDirectory } from './architecture-analyzer.js';

describe('Architecture Analyzer deterministic logic', () => {
  let tempRepoDir: string;

  before(async () => {
    // Set up a temporary mock repository directory structure
    tempRepoDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'devflow-test-repo-'));

    // 1. Root config files
    await fs.promises.writeFile(path.join(tempRepoDir, 'package.json'), JSON.stringify({
      name: 'test-monorepo',
      private: true,
      workspaces: ['apps/*', 'packages/*'],
      scripts: {
        start: 'node dist/server.js',
        dev: 'tsx server.ts'
      }
    }));
    await fs.promises.writeFile(path.join(tempRepoDir, 'Dockerfile'), 'FROM node:20');
    await fs.promises.writeFile(path.join(tempRepoDir, 'docker-compose.yml'), 'version: "3"');

    // 2. apps/ directory
    await fs.promises.mkdir(path.join(tempRepoDir, 'apps'), { recursive: true });

    // 2a. apps/api workspace (Express Backend)
    const apiDir = path.join(tempRepoDir, 'apps/api');
    await fs.promises.mkdir(apiDir, { recursive: true });
    await fs.promises.writeFile(path.join(apiDir, 'package.json'), JSON.stringify({
      name: 'api-service',
      dependencies: {
        express: '^4.19.2'
      }
    }));
    await fs.promises.mkdir(path.join(apiDir, 'routes'), { recursive: true });
    await fs.promises.mkdir(path.join(apiDir, 'controllers'), { recursive: true });
    await fs.promises.mkdir(path.join(apiDir, 'services'), { recursive: true });
    await fs.promises.mkdir(path.join(apiDir, 'models'), { recursive: true });

    await fs.promises.writeFile(path.join(apiDir, 'server.ts'), 'console.log("api server")');

    // 2b. apps/web workspace (React Frontend)
    const webDir = path.join(tempRepoDir, 'apps/web');
    await fs.promises.mkdir(webDir, { recursive: true });
    await fs.promises.writeFile(path.join(webDir, 'package.json'), JSON.stringify({
      name: 'web-app',
      dependencies: {
        react: '^18.3.1'
      }
    }));
    await fs.promises.mkdir(path.join(webDir, 'components'), { recursive: true });
    await fs.promises.mkdir(path.join(webDir, 'pages'), { recursive: true });
    await fs.promises.mkdir(path.join(webDir, 'hooks'), { recursive: true });

    // 3. packages/ shared package
    const commonDir = path.join(tempRepoDir, 'packages/common');
    await fs.promises.mkdir(commonDir, { recursive: true });
    await fs.promises.writeFile(path.join(commonDir, 'package.json'), JSON.stringify({
      name: 'shared-common',
      private: true
    }));
  });

  after(async () => {
    // Clean up temp repository directory
    if (tempRepoDir) {
      await fs.promises.rm(tempRepoDir, { recursive: true, force: true });
    }
  });

  test('classifyDirectory returns correct roles and classifications', () => {
    const controllers = classifyDirectory('controllers');
    assert.deepEqual(controllers, { classification: 'controller layer', confidence: 'high' });

    const components = classifyDirectory('components');
    assert.deepEqual(components, { classification: 'UI/component layer', confidence: 'high' });

    const config = classifyDirectory('config');
    assert.deepEqual(config, { classification: 'configuration', confidence: 'medium' });

    const unknown = classifyDirectory('unknown-folder');
    assert.equal(unknown, null);
  });

  test('analyzeArchitecture detects monorepos and correct workspace boundaries', async () => {
    const result = await analyzeArchitecture(tempRepoDir);

    // Verify workspace boundaries are correctly extracted
    assert.equal(result.workspaceBoundaries.length, 3);

    const apiWs = result.workspaceBoundaries.find(w => w.name === 'api-service');
    assert.ok(apiWs);
    assert.equal(apiWs?.type, 'backend');
    assert.equal(apiWs?.detectedFramework, 'Express');

    const webWs = result.workspaceBoundaries.find(w => w.name === 'web-app');
    assert.ok(webWs);
    assert.equal(webWs?.type, 'frontend');
    assert.equal(webWs?.detectedFramework, 'React');

    const commonWs = result.workspaceBoundaries.find(w => w.name === 'shared-common');
    assert.ok(commonWs);
    assert.equal(commonWs?.type, 'library');
  });

  test('analyzeArchitecture detects correct structural and design signals', async () => {
    const result = await analyzeArchitecture(tempRepoDir);

    const signalNames = result.signals.map(s => s.name);

    assert.ok(signalNames.includes('Workspace-based monorepo'));
    assert.ok(signalNames.includes('Separated frontend and backend applications'));
    assert.ok(signalNames.includes('Layered backend architecture'));
    assert.ok(signalNames.includes('Component-oriented frontend structure'));
    assert.ok(signalNames.includes('Containerized deployment configuration'));
  });

  test('analyzeArchitecture detects entry points from files and scripts', async () => {
    const result = await analyzeArchitecture(tempRepoDir);

    // Should find entrypoint from the root package.json start script
    const scriptsEntry = result.entryPoints.find(e => e.type === 'script');
    assert.ok(scriptsEntry);
    assert.ok(scriptsEntry?.path.includes('npm run') || scriptsEntry?.path.includes('server.js'));
  });
});
