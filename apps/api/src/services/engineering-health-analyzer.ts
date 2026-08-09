import fs from 'node:fs';
import path from 'node:path';
import {
  EngineeringHealth,
  RiskFinding,
  HealthSignal,
  HealthDimension,
  EngineeringHealthMetrics,
  RepositoryDependency,
  RepositoryArchitecture,
  RepositoryApiSurface
} from '@devflow/shared';
import { IGNORED_DIRECTORIES } from './repo-inspector.js';

interface PackageJsonData {
  name?: string;
  version?: string;
  private?: boolean;
  workspaces?: string[] | { packages?: string[] };
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

export async function analyzeEngineeringHealth(
  repoDir: string,
  metadata: {
    fileCount: number;
    directoryCount: number;
    totalBytes: number;
    extensionCounts: Record<string, number>;
    detectedFiles: string[];
  },
  dependencies: RepositoryDependency[],
  architecture: RepositoryArchitecture,
  apiSurface: RepositoryApiSurface,
  appType: string,
  pkgData: PackageJsonData | null
): Promise<EngineeringHealth> {
  const testFiles: string[] = [];
  const testDirsSet = new Set<string>();
  const envFiles: string[] = [];
  const privateKeys: string[] = [];
  const largeSourceFiles: { path: string; lines: number }[] = [];
  const deepDirs: string[] = [];
  
  let hasCiWorkflow = false;
  let hasDeploymentConfig = false;
  let hasGitignore = false;
  let hasReadme = false;
  let hasLicense = false;
  let hasTsConfig = false;

  // 1. Walk local repo directory recursively to collect health signals, security metadata & maintainability metrics
  async function walk(currentDir: string, depth = 0) {
    const entries = await fs.promises.readdir(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const relPath = path.relative(repoDir, path.join(currentDir, entry.name));
      
      if (entry.isDirectory()) {
        if (IGNORED_DIRECTORIES.has(entry.name)) {
          continue;
        }

        // Deep directory check (> 6 levels)
        if (depth > 6) {
          deepDirs.push(relPath);
        }

        // Test directories detection
        const dirLower = entry.name.toLowerCase();
        if (dirLower === 'test' || dirLower === 'tests' || dirLower === '__tests__' || dirLower === 'spec' || dirLower === 'specs') {
          testDirsSet.add(relPath);
        }

        await walk(path.join(currentDir, entry.name), depth + 1);
      } else if (entry.isFile()) {
        const fileLower = entry.name.toLowerCase();

        // Gitignore
        if (fileLower === '.gitignore') {
          hasGitignore = true;
        }
        // README
        if (fileLower === 'readme.md') {
          hasReadme = true;
        }
        // LICENSE
        if (fileLower === 'license' || fileLower === 'license.txt' || fileLower === 'license.md') {
          hasLicense = true;
        }
        // tsconfig.json
        if (fileLower === 'tsconfig.json') {
          hasTsConfig = true;
        }

        // CI Workflows
        if (
          relPath.startsWith('.github/workflows') &&
          (fileLower.endsWith('.yml') || fileLower.endsWith('.yaml'))
        ) {
          hasCiWorkflow = true;
        } else if (
          fileLower === '.gitlab-ci.yml' ||
          relPath.startsWith('.circleci') ||
          fileLower === 'jenkinsfile' ||
          fileLower === 'azure-pipelines.yml'
        ) {
          hasCiWorkflow = true;
        }

        // Deployment config
        if (
          fileLower === 'dockerfile' ||
          fileLower === 'docker-compose.yml' ||
          fileLower === 'docker-compose.yaml' ||
          fileLower === 'compose.yml' ||
          fileLower === 'railway.json' ||
          fileLower === 'render.yaml' ||
          fileLower === 'fly.toml' ||
          fileLower === 'vercel.json' ||
          fileLower === 'netlify.toml'
        ) {
          hasDeploymentConfig = true;
        }

        // .env detection (avoid example/template)
        if (
          (fileLower.startsWith('.env') &&
            !fileLower.endsWith('.example') &&
            !fileLower.endsWith('.template') &&
            !fileLower.endsWith('.sample')) ||
          fileLower === '.env'
        ) {
          envFiles.push(relPath);
        }

        // Private keys detection
        if (
          fileLower.endsWith('.pem') ||
          fileLower.endsWith('.key') ||
          fileLower === 'id_rsa' ||
          fileLower === 'id_ed25519'
        ) {
          privateKeys.push(relPath);
        }

        // Test files detection
        const isTestFile =
          /\.(test|spec)\.[jt]sx?$/i.test(entry.name) ||
          /_test\.go$/i.test(entry.name) ||
          /Test\.java$/i.test(entry.name) ||
          /^test_.*\.py$/i.test(entry.name);

        if (isTestFile) {
          testFiles.push(relPath);
        }

        // Source file line counting & maintainability check
        const ext = path.extname(entry.name).toLowerCase();
        const isSourceFile = [
          '.ts', '.tsx', '.js', '.jsx', '.py', '.go', '.rs',
          '.java', '.rb', '.php', '.cs', '.swift', '.kt', '.c', '.cpp'
        ].includes(ext);

        if (isSourceFile) {
          const entryPath = path.join(currentDir, entry.name);
          try {
            const stats = await fs.promises.stat(entryPath);
            // Ignore oversized source files (> 500KB) from full reading, treat as large
            if (stats.size > 500 * 1024) {
              largeSourceFiles.push({ path: relPath, lines: 10000 }); // simulated huge size
            } else {
              const content = await fs.promises.readFile(entryPath, 'utf-8');
              const lines = content.split('\n').length;
              if (lines > 1000) {
                largeSourceFiles.push({ path: relPath, lines });
              }
            }
          } catch {
            // Ignore unreadable files
          }
        }
      }
    }
  }

  try {
    await walk(repoDir);
  } catch (e) {
    console.error('[health-analyzer] Error walking repo dir:', e);
  }

  // 2. Testing Frameworks detection from package.json & codebase evidence
  const detectedTestingFrameworks: string[] = [];
  const allDeps = {
    ...(pkgData?.dependencies || {}),
    ...(pkgData?.devDependencies || {}),
  };

  if (allDeps['jest']) detectedTestingFrameworks.push('Jest');
  if (allDeps['vitest']) detectedTestingFrameworks.push('Vitest');
  if (allDeps['mocha']) detectedTestingFrameworks.push('Mocha');
  if (allDeps['ava']) detectedTestingFrameworks.push('AVA');
  if (allDeps['@playwright/test']) detectedTestingFrameworks.push('Playwright');
  if (allDeps['cypress']) detectedTestingFrameworks.push('Cypress');
  
  if (metadata.extensionCounts['.py'] > 0 && (allDeps['pytest'] || metadata.detectedFiles.some(f => f.includes('pytest')))) {
    detectedTestingFrameworks.push('Pytest');
  }
  if (metadata.extensionCounts['.go'] > 0 && testFiles.some(f => f.endsWith('_test.go'))) {
    detectedTestingFrameworks.push('Go test');
  }
  if (metadata.extensionCounts['.rs'] > 0 && pkgData === null) {
    // Rust has built-in cargo test
    detectedTestingFrameworks.push('Cargo test');
  }

  // 3. Finding Lists
  const findings: RiskFinding[] = [];
  const positiveSignals: HealthSignal[] = [];

  // Testing Rules
  if (testFiles.length === 0 && testDirsSet.size === 0) {
    const isApp = ['backend API', 'full-stack app', 'frontend app', 'monorepo'].includes(appType);
    findings.push({
      id: 'missing-tests',
      category: 'testing',
      severity: isApp ? 'medium' : 'low',
      title: 'Limited automated test coverage signals',
      description: 'No test files or test directories were detected within the analyzed repository scope.',
      evidence: [
        'No test directories detected',
        '0 test files detected within the analyzed repository scope.'
      ],
      confidence: 'high',
      scoreImpact: isApp ? -12 : -5
    });
  } else {
    const fwDesc = detectedTestingFrameworks.length > 0 ? ` (${detectedTestingFrameworks.join(' + ')})` : '';
    positiveSignals.push({
      name: 'Automated testing structure detected',
      evidence: [
        `Found ${testFiles.length} test files and ${testDirsSet.size} test directories${fwDesc}.`
      ]
    });
  }

  // Architecture Rules
  const activeSignals = architecture.signals.map(s => s.name);
  if (activeSignals.length > 0) {
    positiveSignals.push({
      name: 'Structured repository architecture',
      evidence: activeSignals.map(s => `Detected signal: ${s}`)
    });
  }
  if (architecture.workspaceBoundaries.length > 0) {
    positiveSignals.push({
      name: 'Workspace boundaries defined',
      evidence: [`Detected ${architecture.workspaceBoundaries.length} workspace modules/boundaries.`]
    });
  }

  if (architecture.entryPoints.length === 0) {
    findings.push({
      id: 'missing-entrypoints',
      category: 'architecture',
      severity: 'low',
      title: 'No clear entry points detected',
      description: 'No standard application entry points (like server.ts, index.ts, main.tsx) or startup scripts were detected.',
      evidence: ['No entry point files or scripts detected'],
      confidence: 'medium',
      scoreImpact: -5
    });
  }
  if (architecture.importantDirectories.length === 0 && metadata.fileCount > 10) {
    findings.push({
      id: 'unstructured-architecture',
      category: 'architecture',
      severity: 'medium',
      title: 'Unstructured directory layout',
      description: 'The repository lacks standard architectural folders (like src, app, components, services, or routes) despite having a significant number of files.',
      evidence: [`Found ${metadata.fileCount} files but 0 structured directories`],
      confidence: 'high',
      scoreImpact: -7
    });
  }

  // Dependency Rules
  const hasLockfile = metadata.detectedFiles.some(f =>
    ['pnpm-lock.yaml', 'package-lock.json', 'yarn.lock', 'bun.lockb', 'bun.lock', 'poetry.lock', 'Cargo.lock', 'go.sum'].includes(f)
  );

  // Determine if a package manager or config file suggests we should have a lockfile
  const needsLockfile = pkgData !== null || metadata.detectedFiles.some(f =>
    ['package.json', 'Cargo.toml', 'go.mod', 'pom.xml', 'build.gradle', 'requirements.txt'].includes(f)
  );

  if (needsLockfile && !hasLockfile) {
    findings.push({
      id: 'missing-lockfile',
      category: 'dependency',
      severity: 'high',
      title: 'Missing package lockfile',
      description: 'No dependency lockfile (such as package-lock.json, pnpm-lock.yaml, or yarn.lock) was detected. This can lead to non-deterministic, inconsistent production builds.',
      evidence: ['No lockfile detected despite package manifest configurations.'],
      confidence: 'high',
      scoreImpact: -10
    });
  } else if (hasLockfile) {
    positiveSignals.push({
      name: 'Dependency lockfile present',
      evidence: ['Lockfile detected for package/dependency management, ensuring deterministic builds.']
    });
  }

  // Count direct production dependencies
  const productionDependencies = dependencies.filter(d => d.type === 'production');
  if (productionDependencies.length > 60) {
    findings.push({
      id: 'excessive-dependencies',
      category: 'dependency',
      severity: 'low',
      title: 'High production dependency count',
      description: 'The project registers a large number of direct production dependencies, which increases the supply-chain risk and maintenance surface.',
      evidence: [`Found ${productionDependencies.length} direct production dependencies.`],
      confidence: 'high',
      scoreImpact: -4
    });
  } else if (dependencies.length > 0) {
    positiveSignals.push({
      name: 'Dependency categories separated',
      evidence: [`Project cleanly manages ${dependencies.length} direct dependencies.`]
    });
  }

  // Repository Hygiene Rules
  if (hasReadme) {
    positiveSignals.push({
      name: 'README.md documentation detected',
      evidence: ['README.md file is present at the repository root.']
    });
  } else {
    findings.push({
      id: 'missing-readme',
      category: 'repoHygiene',
      severity: metadata.fileCount > 5 ? 'medium' : 'low',
      title: 'No README.md file detected',
      description: 'The repository lacks a README.md file at the root. Documentation is critical for onboarding and maintaining software.',
      evidence: ['README.md not found in root directory'],
      confidence: 'high',
      scoreImpact: -5
    });
  }

  if (hasGitignore) {
    positiveSignals.push({
      name: '.gitignore file detected',
      evidence: ['.gitignore file is present at the repository root.']
    });
  } else {
    findings.push({
      id: 'missing-gitignore',
      category: 'repoHygiene',
      severity: 'medium',
      title: 'No .gitignore file detected',
      description: 'No .gitignore file was found in the repository root. This increases the risk of accidentally committing build artifacts, dependencies, or sensitive secrets.',
      evidence: ['.gitignore not found in root directory'],
      confidence: 'high',
      scoreImpact: -5
    });
  }

  if (hasLicense) {
    positiveSignals.push({
      name: 'LICENSE file detected',
      evidence: ['LICENSE file is present in the repository root.']
    });
  } else {
    findings.push({
      id: 'missing-license',
      category: 'repoHygiene',
      severity: 'low',
      title: 'No LICENSE file detected',
      description: 'No open-source license file (LICENSE) was found. Explicit licensing is recommended for public repositories.',
      evidence: ['LICENSE or LICENSE.md not found in root directory'],
      confidence: 'high',
      scoreImpact: -2
    });
  }

  // Configuration & Security Hygiene Rules
  if (envFiles.length > 0) {
    findings.push({
      id: 'committed-env-file',
      category: 'configHygiene',
      severity: 'high',
      title: 'Potential secret-bearing environment file detected',
      description: 'An environment configuration file (like .env) was found committed to the repository. This is a security risk as these files often contain secret API keys, credentials, or private configurations.',
      evidence: envFiles, // only paths, NO content
      confidence: 'high',
      scoreImpact: -10
    });
  } else {
    positiveSignals.push({
      name: 'No committed environment configuration files',
      evidence: ['Verified that no potential secret-bearing .env files are committed in the repository scope.']
    });
  }

  if (privateKeys.length > 0) {
    findings.push({
      id: 'committed-private-key',
      category: 'configHygiene',
      severity: 'critical',
      title: 'Private key file committed to repository',
      description: 'A private key file (like .pem or id_rsa) was detected in the repository. Private keys should never be committed to source control.',
      evidence: privateKeys, // only paths, NO content
      confidence: 'high',
      scoreImpact: -15
    });
  } else {
    positiveSignals.push({
      name: 'No committed private key files',
      evidence: ['Verified that no private keys (*.pem, *.key, id_rsa) are committed in the repository scope.']
    });
  }

  // TypeScript heavy missing tsconfig check
  const tsFilesCount = metadata.extensionCounts['.ts'] || 0;
  const tsxFilesCount = metadata.extensionCounts['.tsx'] || 0;
  const isTsHeavy = (tsFilesCount + tsxFilesCount) > 5;
  if (isTsHeavy && !hasTsConfig) {
    findings.push({
      id: 'missing-tsconfig',
      category: 'configHygiene',
      severity: 'low',
      title: 'TypeScript configuration missing in TS project',
      description: 'A high volume of TypeScript files was detected, but no tsconfig.json file was found at the workspace root.',
      evidence: [`Detected ${tsFilesCount + tsxFilesCount} TypeScript files but tsconfig.json is absent.`],
      confidence: 'high',
      scoreImpact: -4
    });
  } else if (hasTsConfig) {
    positiveSignals.push({
      name: 'TypeScript configuration detected',
      evidence: ['tsconfig.json file is present, defining compiler rules for type safety.']
    });
  }

  if (hasCiWorkflow) {
    positiveSignals.push({
      name: 'CI workflow detected',
      evidence: ['Continuous Integration configuration is active (GitHub Actions, GitLab CI, CircleCI or Jenkins).']
    });
  }

  if (hasDeploymentConfig) {
    positiveSignals.push({
      name: 'Container deployment configuration detected',
      evidence: ['Docker/Deployment files (Dockerfile, compose, or render/vercel specs) are ready for container orchestration.']
    });
  }

  // Maintainability Rules
  if (largeSourceFiles.length > 0) {
    const isMany = largeSourceFiles.length > 3;
    const impact = Math.max(-8, largeSourceFiles.length * -2);
    findings.push({
      id: 'large-source-files',
      category: 'maintainability',
      severity: isMany ? 'medium' : 'low',
      title: 'Large source files detected',
      description: 'Some source files exceed 1,000 lines of code. Extracting modules or splitting responsibilities into smaller files is recommended for maintainability.',
      evidence: largeSourceFiles.map(f => `${f.path} — ${f.lines.toLocaleString()} lines`),
      confidence: 'high',
      scoreImpact: impact
    });
  } else {
    positiveSignals.push({
      name: 'Highly maintainable source file sizes',
      evidence: ['All scanned source code files are within a highly maintainable length threshold (< 1,000 lines).']
    });
  }

  if (deepDirs.length > 0) {
    findings.push({
      id: 'deep-directory-structure',
      category: 'maintainability',
      severity: 'low',
      title: 'Deep directory structure',
      description: 'The directory nesting depth exceeds 6 levels, which can make the codebase harder to navigate.',
      evidence: deepDirs.slice(0, 5).map(d => `${d} (exceeds depth threshold)`),
      confidence: 'high',
      scoreImpact: -3
    });
  } else {
    positiveSignals.push({
      name: 'Standard shallow directory depth',
      evidence: ['All repository folders maintain standard shallow levels, optimizing navigability (< 7 levels).']
    });
  }

  // API Structure Rules
  const hasApiFramework = apiSurface.frameworks.length > 0;
  const hasRoutes = apiSurface.routes.length > 0;
  const hasOpenApiOrGql = apiSurface.graphql.length > 0 || apiSurface.signals.some(s => s.signal.toLowerCase().includes('openapi') || s.signal.toLowerCase().includes('swagger'));

  if (hasApiFramework && !hasRoutes) {
    findings.push({
      id: 'unrouted-api-framework',
      category: 'apiStructure',
      severity: 'low',
      title: 'API framework without active routes',
      description: 'An API framework (like Express or Hono) is declared in dependencies, but no active HTTP routes were extracted.',
      evidence: [`Detected ${apiSurface.frameworks.map(f => f.name).join(', ')} dependency but 0 routes found.`],
      confidence: 'high',
      scoreImpact: -3
    });
  } else if (hasRoutes) {
    positiveSignals.push({
      name: 'API organized through routes/controllers',
      evidence: [
        `Successfully extracted ${apiSurface.routes.length} HTTP routes routed via ${apiSurface.frameworks.map(f => f.name).join(', ') || 'Framework'}.`
      ]
    });
  }

  if (hasOpenApiOrGql) {
    positiveSignals.push({
      name: 'Structured API surface (GraphQL/OpenAPI)',
      evidence: ['Detected active GraphQL schemes or OpenAPI document declarations.']
    });
  }

  // Project Structure Rules
  if (appType === 'general application') {
    findings.push({
      id: 'unclassified-project-layout',
      category: 'projectStructure',
      severity: 'info',
      title: 'General unclassified project layout',
      description: 'The project structure does not match a typical template (monorepo, client/server, CLI, library). Consider organizing files into standard layout paradigms.',
      evidence: ['Project classified as general application due to lack of distinct structural signals'],
      confidence: 'medium',
      scoreImpact: -2
    });
  } else {
    positiveSignals.push({
      name: 'Consistent project layout',
      evidence: [`Repository cleanly matches the '${appType}' project layout structure.`]
    });
  }

  // 4. Score Dimensions Definition & Score Calculation
  const dimensions: HealthDimension[] = [
    { name: 'Testing', score: 20, maxScore: 20, description: 'Automated test suite, directories, and framework configurations.' },
    { name: 'Architecture', score: 15, maxScore: 15, description: 'Clean separations, clear entry points, and workspace modularity.' },
    { name: 'Dependency Hygiene', score: 15, maxScore: 15, description: 'Lockfile reliability and package-chain security surface.' },
    { name: 'Repository Hygiene', score: 15, maxScore: 15, description: 'Proper documentation (README), LICENSE, and VCS ignoring (.gitignore).' },
    { name: 'Configuration Hygiene', score: 15, maxScore: 15, description: 'Safety from committed private keys, credentials, or environment files.' },
    { name: 'Maintainability', score: 10, maxScore: 10, description: 'Modest file size lengths, shallow folder depths, and code layouts.' },
    { name: 'API Structure', score: 5, maxScore: 5, description: 'Well-structured routing paradigms and API documentations.' },
    { name: 'Project Structure', score: 5, maxScore: 5, description: 'Well-defined workspace types and structured layout paradigms.' },
  ];

  // Map category code to dimension names
  const categoryToDimension: Record<string, string> = {
    testing: 'Testing',
    architecture: 'Architecture',
    dependency: 'Dependency Hygiene',
    repoHygiene: 'Repository Hygiene',
    configHygiene: 'Configuration Hygiene',
    maintainability: 'Maintainability',
    apiStructure: 'API Structure',
    projectStructure: 'Project Structure',
  };

  // Adjust score of each dimension based on its findings
  for (const dim of dimensions) {
    const dimFindings = findings.filter(f => categoryToDimension[f.category] === dim.name);
    const totalDeductions = dimFindings.reduce((sum, f) => sum + Math.abs(f.scoreImpact), 0);
    dim.score = Math.max(0, dim.maxScore - totalDeductions);
  }

  // Calculate overall health score
  const score = Math.round(dimensions.reduce((sum, dim) => sum + dim.score, 0));

  // Ensure overall score is bounded [0, 100]
  const finalScore = Math.max(0, Math.min(100, score));

  // Compile final metrics block
  const metrics: EngineeringHealthMetrics = {
    testFileCount: testFiles.length,
    testDirectoryCount: testDirsSet.size,
    detectedTestingFrameworks,
    largeSourceFilesCount: largeSourceFiles.length,
    hasEnvFiles: envFiles.length > 0,
    hasPrivateKeys: privateKeys.length > 0,
  };

  return {
    score: finalScore,
    dimensions,
    findings,
    positiveSignals,
    metrics
  };
}
