import fs from 'node:fs';
import path from 'node:path';
import {
  ArchitectureTreeNode,
  ArchitectureDirectory,
  ArchitectureSignal,
  ArchitectureEntryPoint,
  ArchitectureWorkspace,
  RepositoryArchitecture
} from '@devflow/shared';

const IGNORED_DIRS = new Set([
  '.git',
  'node_modules',
  'dist',
  'build',
  'coverage',
  '.next',
  '.cache',
  '.turbo',
  'target',
  'vendor',
  '.DS_Store'
]);

const PRIORITY_DIRS = new Set([
  'src',
  'apps',
  'packages',
  'services',
  'server',
  'client',
  'frontend',
  'backend',
  'api',
  'components',
  'controllers',
  'repositories',
  'routes',
  'middleware',
  'models',
  'database',
  'lib',
  'utils',
  'config',
  'tests',
  'scripts',
  'pages',
  'hooks',
  '__tests__'
]);

const COMMON_CONFIG_FILES = new Set([
  'package.json',
  'pnpm-workspace.yaml',
  'tsconfig.json',
  'Dockerfile',
  'docker-compose.yml',
  'docker-compose.yaml',
  'compose.yml',
  'README.md',
  'Cargo.toml',
  'go.mod',
  'pyproject.toml',
  'requirements.txt',
  'pom.xml',
  'build.gradle'
]);

/**
 * Classifies directories based on their name.
 */
export function classifyDirectory(name: string): { classification: string; confidence: 'high' | 'medium' | 'low' } | null {
  const lower = name.toLowerCase();
  if (lower === 'controllers') return { classification: 'controller layer', confidence: 'high' };
  if (lower === 'services') return { classification: 'service/business layer', confidence: 'high' };
  if (lower === 'repositories') return { classification: 'persistence/data layer', confidence: 'high' };
  if (lower === 'routes') return { classification: 'routing layer', confidence: 'high' };
  if (lower === 'middleware') return { classification: 'middleware layer', confidence: 'high' };
  if (lower === 'models') return { classification: 'data/domain models', confidence: 'high' };
  if (lower === 'components') return { classification: 'UI/component layer', confidence: 'high' };
  if (lower === 'pages') return { classification: 'frontend routing/page layer', confidence: 'high' };
  if (lower === 'hooks') return { classification: 'frontend hooks', confidence: 'high' };
  if (lower === 'utils' || lower === 'lib') return { classification: 'utility/shared layer', confidence: 'medium' };
  if (lower === 'tests' || lower === '__tests__') return { classification: 'testing', confidence: 'high' };
  if (lower === 'config') return { classification: 'configuration', confidence: 'medium' };
  if (lower === 'scripts') return { classification: 'tooling', confidence: 'medium' };
  return null;
}

/**
 * Safely reads and parses a package.json file.
 */
async function safeReadJson(filePath: string): Promise<any | null> {
  try {
    const content = await fs.promises.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}

/**
 * Deterministically analyzes the repository architecture.
 */
export async function analyzeArchitecture(repoDir: string): Promise<RepositoryArchitecture> {
  const rootPkgData = await safeReadJson(path.join(repoDir, 'package.json'));

  // Traversal state
  const importantDirectories: ArchitectureDirectory[] = [];
  const allRelativeFiles: string[] = [];
  const detectedDirectoriesSet = new Set<string>();

  // Limits to avoid scanning huge repositories recursively without bounds
  let totalDirsScanned = 0;
  let totalFilesScanned = 0;
  const MAX_DIRS = 300;
  const MAX_FILES = 1000;

  // Track observed layer names for Layered Backend signal
  const observedLayers = new Set<string>();
  // Track observed UI components for Component Frontend signal
  const observedFrontendFolders = new Set<string>();
  // Track test sightings
  let testFilesOrDirsFound = false;

  // Let's recursively traverse the directory up to depth 4
  async function scan(currentDir: string, relPath: string, depth: number) {
    if (depth > 4) return;
    if (totalDirsScanned >= MAX_DIRS || totalFilesScanned >= MAX_FILES) return;

    let entries: fs.Dirent[] = [];
    try {
      entries = await fs.promises.readdir(currentDir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const entryRelPath = relPath ? `${relPath}/${entry.name}` : entry.name;

      if (entry.isDirectory()) {
        if (IGNORED_DIRS.has(entry.name)) continue;
        totalDirsScanned++;

        detectedDirectoriesSet.add(entryRelPath);

        // Classification
        const classification = classifyDirectory(entry.name);
        if (classification) {
          importantDirectories.push({
            path: entryRelPath,
            name: entry.name,
            classification: classification.classification,
            confidence: classification.confidence
          });

          // Track backend layers
          if (['controllers', 'services', 'repositories', 'routes', 'middleware', 'models', 'database'].includes(entry.name.toLowerCase())) {
            observedLayers.add(entry.name.toLowerCase());
          }
          // Track frontend parts
          if (['components', 'pages', 'hooks'].includes(entry.name.toLowerCase())) {
            observedFrontendFolders.add(entry.name.toLowerCase());
          }
          // Track testing
          if (['tests', '__tests__'].includes(entry.name.toLowerCase())) {
            testFilesOrDirsFound = true;
          }
        }

        await scan(path.join(currentDir, entry.name), entryRelPath, depth + 1);
      } else if (entry.isFile()) {
        totalFilesScanned++;
        allRelativeFiles.push(entryRelPath);

        // Test files detection
        if (entry.name.endsWith('.test.ts') || entry.name.endsWith('.spec.ts') || entry.name.endsWith('.test.js') || entry.name.endsWith('.spec.js')) {
          testFilesOrDirsFound = true;
        }
      }
    }
  }

  await scan(repoDir, '', 1);

  // 1. Build bounded architecture tree
  const tree: ArchitectureTreeNode[] = [];
  let treeNodeCount = 0;
  const MAX_TREE_NODES = 100;

  async function buildTree(currentDir: string, relPath: string, depth: number): Promise<ArchitectureTreeNode[] | undefined> {
    if (depth > 3 || treeNodeCount >= MAX_TREE_NODES) return undefined;

    let entries: fs.Dirent[] = [];
    try {
      entries = await fs.promises.readdir(currentDir, { withFileTypes: true });
    } catch {
      return undefined;
    }

    // Sort entries: directories first, then files
    entries.sort((a, b) => {
      if (a.isDirectory() && !b.isDirectory()) return -1;
      if (!a.isDirectory() && b.isDirectory()) return 1;
      return a.name.localeCompare(b.name);
    });

    const nodes: ArchitectureTreeNode[] = [];

    // Prioritize showing priority directories and config files
    const priorityEntries = entries.filter(e => {
      if (e.isDirectory()) {
        return !IGNORED_DIRS.has(e.name) && (PRIORITY_DIRS.has(e.name) || depth <= 2);
      } else {
        return COMMON_CONFIG_FILES.has(e.name) || e.name.endsWith('.ts') || e.name.endsWith('.js') || e.name.endsWith('.go') || e.name.endsWith('.rs');
      }
    }).slice(0, 15); // limit children per directory

    for (const entry of priorityEntries) {
      if (treeNodeCount >= MAX_TREE_NODES) break;

      const entryRelPath = relPath ? `${relPath}/${entry.name}` : entry.name;

      if (entry.isDirectory()) {
        treeNodeCount++;
        const children = await buildTree(path.join(currentDir, entry.name), entryRelPath, depth + 1);
        nodes.push({
          name: entry.name,
          path: entryRelPath,
          type: 'directory',
          children: children || []
        });
      } else {
        treeNodeCount++;
        nodes.push({
          name: entry.name,
          path: entryRelPath,
          type: 'file'
        });
      }
    }

    return nodes.length > 0 ? nodes : undefined;
  }

  const rootNodes = await buildTree(repoDir, '', 1);
  if (rootNodes) {
    tree.push(...rootNodes);
  }

  // 2. Entry point detection
  const entryPoints: ArchitectureEntryPoint[] = [];
  const checkedEntries = new Set<string>();

  function addEntryPoint(p: string, t: 'file' | 'script', desc: string) {
    const norm = p.replace(/\\/g, '/');
    if (!checkedEntries.has(norm)) {
      checkedEntries.add(norm);
      entryPoints.push({ path: norm, type: t, description: desc });
    }
  }

  // File system entries
  const fileEntryCandidates = [
    'src/index.ts', 'src/index.js',
    'src/main.ts', 'src/main.tsx',
    'src/server.ts', 'src/app.ts', 'src/app.tsx',
    'src/App.tsx', 'index.ts', 'index.js',
    'main.go', 'server.ts', 'server.js', 'app.ts'
  ];

  for (const cand of fileEntryCandidates) {
    if (allRelativeFiles.includes(cand)) {
      addEntryPoint(cand, 'file', 'Likely application entry point file');
    }
  }

  // cmd/*/main.go Go entries
  for (const f of allRelativeFiles) {
    if (f.startsWith('cmd/') && f.endsWith('/main.go')) {
      addEntryPoint(f, 'file', 'Go command entry point');
    }
  }

  // package.json scripts entries
  if (rootPkgData?.scripts) {
    for (const [sKey, sCmd] of Object.entries(rootPkgData.scripts)) {
      if (typeof sCmd === 'string') {
        if (sKey === 'start' || sKey === 'dev' || sKey === 'main') {
          const match = sCmd.match(/(?:node|ts-node|tsx|bun|deno)\s+([a-zA-Z0-9_\-./]+)/);
          if (match && match[1]) {
            const scriptPath = match[1];
            addEntryPoint(scriptPath, 'script', `Entry point detected from package.json "${sKey}" script: "${sCmd}"`);
          } else {
            addEntryPoint(`npm run ${sKey}`, 'script', `Launch command: "${sCmd}"`);
          }
        }
      }
    }
  }

  // 3. Workspace boundaries
  const workspaceBoundaries: ArchitectureWorkspace[] = [];
  const monorepoSubdirs: Array<{ parent: string; name: string }> = [];

  // Look for workspace configurations or apps/* packages/* folders
  const hasWorkspacesField = rootPkgData?.workspaces && (Array.isArray(rootPkgData.workspaces) || typeof rootPkgData.workspaces === 'object');
  const hasAppsDir = detectedDirectoriesSet.has('apps');
  const hasPackagesDir = detectedDirectoriesSet.has('packages');

  if (hasAppsDir || hasPackagesDir || hasWorkspacesField) {
    // Scan apps/ and packages/ directories
    const scanParents = [];
    if (hasAppsDir) scanParents.push('apps');
    if (hasPackagesDir) scanParents.push('packages');

    for (const parent of scanParents) {
      try {
        const subdirs = await fs.promises.readdir(path.join(repoDir, parent), { withFileTypes: true });
        for (const sd of subdirs) {
          if (sd.isDirectory() && !IGNORED_DIRS.has(sd.name)) {
            monorepoSubdirs.push({ parent, name: sd.name });
          }
        }
      } catch {
        // Ignore errors
      }
    }
  }

  for (const { parent, name } of monorepoSubdirs) {
    const wsRelPath = `${parent}/${name}`;
    const wsPkgPath = path.join(repoDir, parent, name, 'package.json');
    const wsPkgData = await safeReadJson(wsPkgPath);

    // Type heuristic
    let type: 'frontend' | 'backend' | 'library' | 'unknown' = 'unknown';
    const lowerName = name.toLowerCase();

    const isFrontendMarker = lowerName.includes('web') || lowerName.includes('client') || lowerName.includes('frontend') || lowerName.includes('ui') || lowerName.includes('dashboard') || lowerName.includes('app');
    const isBackendMarker = lowerName.includes('api') || lowerName.includes('server') || lowerName.includes('backend') || lowerName.includes('service') || lowerName.includes('worker');
    const isLibMarker = lowerName.includes('shared') || lowerName.includes('core') || lowerName.includes('lib') || lowerName.includes('utils') || lowerName.includes('common');

    const deps = { ...(wsPkgData?.dependencies || {}), ...(wsPkgData?.devDependencies || {}) };
    const hasFrontendDeps = deps['react'] || deps['vue'] || deps['svelte'] || deps['next'] || deps['@sveltejs/kit'] || deps['astro'] || deps['@angular/core'];
    const hasBackendDeps = deps['express'] || deps['@nestjs/core'] || deps['fastify'] || deps['hono'] || deps['koa'];

    if (isFrontendMarker || hasFrontendDeps) {
      type = 'frontend';
    } else if (isBackendMarker || hasBackendDeps) {
      type = 'backend';
    } else if (isLibMarker) {
      type = 'library';
    } else if (wsPkgData) {
      type = wsPkgData.private ? 'library' : 'unknown';
    }

    // Languages detection for workspace
    let detectedLanguage = 'TypeScript';
    let detectedFramework: string | undefined;

    if (hasFrontendDeps) {
      if (deps['next']) detectedFramework = 'Next.js';
      else if (deps['react']) detectedFramework = 'React';
      else if (deps['vue']) detectedFramework = 'Vue';
      else if (deps['svelte']) detectedFramework = 'Svelte';
    } else if (hasBackendDeps) {
      if (deps['express']) detectedFramework = 'Express';
      else if (deps['@nestjs/core']) detectedFramework = 'NestJS';
      else if (deps['hono']) detectedFramework = 'Hono';
    }

    // File extensions quick check inside this workspace subdir
    try {
      const files = await fs.promises.readdir(path.join(repoDir, parent, name));
      if (files.includes('Cargo.toml')) {
        detectedLanguage = 'Rust';
        detectedFramework = 'Cargo';
      } else if (files.includes('go.mod')) {
        detectedLanguage = 'Go';
        detectedFramework = 'Go Modules';
      } else if (files.includes('requirements.txt') || files.includes('pyproject.toml')) {
        detectedLanguage = 'Python';
      }
    } catch {
      // Ignore
    }

    workspaceBoundaries.push({
      path: wsRelPath,
      name: wsPkgData?.name || name,
      type,
      detectedLanguage,
      detectedFramework
    });
  }

  // 4. Architectural Signals
  const signals: ArchitectureSignal[] = [];

  // A. Monorepo Signal
  const isMonorepo = workspaceBoundaries.length > 0 || hasWorkspacesField || (detectedDirectoriesSet.has('apps') && detectedDirectoriesSet.has('packages'));
  if (isMonorepo) {
    let desc = 'The codebase is structured as a monorepo containing multiple separate projects/packages, enabling coordinated development of shared code.';
    if (hasWorkspacesField) {
      desc += ' Root workspace configuration found in package.json.';
    } else if (fs.existsSync(path.join(repoDir, 'pnpm-workspace.yaml'))) {
      desc += ' PNPM workspace layout detected (pnpm-workspace.yaml).';
    }
    signals.push({
      name: 'Workspace-based monorepo',
      description: desc
    });
  }

  // B. Client/Server Separation
  const hasClientServerFolders =
    (detectedDirectoriesSet.has('apps/web') && detectedDirectoriesSet.has('apps/api')) ||
    (detectedDirectoriesSet.has('frontend') && detectedDirectoriesSet.has('backend')) ||
    (detectedDirectoriesSet.has('client') && detectedDirectoriesSet.has('server'));

  const hasClientServerWorkspaceTypes =
    workspaceBoundaries.some(w => w.type === 'frontend') && workspaceBoundaries.some(w => w.type === 'backend');

  if (hasClientServerFolders || hasClientServerWorkspaceTypes) {
    signals.push({
      name: 'Separated frontend and backend applications',
      description: 'De-coupled front-end and back-end applications found within the repository, separating user interface from business APIs.'
    });
  }

  // C. Layered Backend
  if (observedLayers.size >= 2) {
    const layersList = Array.from(observedLayers).map(l => `${l}/`);
    signals.push({
      name: 'Layered backend architecture',
      description: `Observed layered software architecture pattern with dedicated folders for backend layers: ${layersList.join(', ')}.`
    });
  }

  // D. Component Frontend
  if (observedFrontendFolders.size >= 1) {
    const componentFolders = Array.from(observedFrontendFolders).map(f => `${f}/`);
    signals.push({
      name: 'Component-oriented frontend structure',
      description: `Modular frontend UI structure leveraging components or page components to construct user interfaces. Folders: ${componentFolders.join(', ')}.`
    });
  }

  // E. Automated Testing
  if (testFilesOrDirsFound) {
    signals.push({
      name: 'Dedicated automated testing structure',
      description: 'Automated tests and suites structured in dedicated folders or files to verify functionality and ensure codebase stability.'
    });
  }

  // F. Containerization
  const hasDockerFiles =
    allRelativeFiles.includes('Dockerfile') ||
    allRelativeFiles.includes('docker-compose.yml') ||
    allRelativeFiles.includes('docker-compose.yaml') ||
    allRelativeFiles.includes('compose.yml');

  if (hasDockerFiles) {
    signals.push({
      name: 'Containerized deployment configuration',
      description: 'Includes Docker containerization configuration for standardized, reproducible deployments across environments.'
    });
  }

  // Fallback / standard single-package
  if (signals.length === 0) {
    signals.push({
      name: 'Standard single-package project',
      description: 'Deterministic codebase organized as a single-package project with no nested workspaces or complex multi-tier boundaries.'
    });
  }

  // 5. API Surface Boundaries mapping
  const apiBoundaries: string[] = [];
  if (detectedDirectoriesSet.has('routes')) apiBoundaries.push('routes/');
  if (detectedDirectoriesSet.has('controllers')) apiBoundaries.push('controllers/');
  if (detectedDirectoriesSet.has('api')) apiBoundaries.push('api/');
  if (detectedDirectoriesSet.has('handlers')) apiBoundaries.push('handlers/');
  if (apiBoundaries.length === 0) {
    apiBoundaries.push('No custom API boundaries detected');
  }

  return {
    tree,
    importantDirectories,
    entryPoints,
    signals,
    workspaceBoundaries,
    apiBoundaries
  };
}
