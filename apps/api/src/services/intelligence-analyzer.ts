import fs from 'node:fs';
import path from 'node:path';
import {
  RepositoryIntelligence,
  DetectedLanguage,
  DetectedFramework,
} from '@devflow/shared';
import { RepositoryMetadata, IGNORED_DIRECTORIES } from './repo-inspector.js';

interface PackageJsonData {
  name?: string;
  version?: string;
  private?: boolean;
  workspaces?: string[] | { packages?: string[] };
  bin?: Record<string, string> | string;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

const EXTENSION_LANGUAGE_MAP: Record<string, string> = {
  '.ts': 'TypeScript',
  '.tsx': 'TypeScript',
  '.js': 'JavaScript',
  '.jsx': 'JavaScript',
  '.mjs': 'JavaScript',
  '.cjs': 'JavaScript',
  '.py': 'Python',
  '.go': 'Go',
  '.rs': 'Rust',
  '.java': 'Java',
  '.rb': 'Ruby',
  '.php': 'PHP',
  '.cs': 'C#',
  '.sql': 'SQL',
  '.kt': 'Kotlin',
  '.swift': 'Swift',
  '.c': 'C',
  '.cpp': 'C++',
  '.cc': 'C++',
  '.h': 'C/C++',
  '.hpp': 'C++',
  '.html': 'HTML',
  '.css': 'CSS',
  '.scss': 'SCSS',
  '.sass': 'Sass',
  '.less': 'Less',
  '.md': 'Markdown',
  '.sh': 'Shell',
  '.bash': 'Shell',
  '.zsh': 'Shell',
};

const FRAMEWORK_DEPENDENCY_RULES: Array<{
  key: string;
  name: string;
  category: 'frontend' | 'backend' | 'fullstack' | 'tooling';
}> = [
  { key: 'next', name: 'Next.js', category: 'fullstack' },
  { key: '@remix-run/react', name: 'Remix', category: 'fullstack' },
  { key: 'astro', name: 'Astro', category: 'fullstack' },
  { key: '@sveltejs/kit', name: 'SvelteKit', category: 'fullstack' },
  { key: 'react', name: 'React', category: 'frontend' },
  { key: 'vue', name: 'Vue', category: 'frontend' },
  { key: 'svelte', name: 'Svelte', category: 'frontend' },
  { key: 'vite', name: 'Vite', category: 'tooling' },
  { key: 'express', name: 'Express', category: 'backend' },
  { key: '@nestjs/core', name: 'NestJS', category: 'backend' },
  { key: 'fastify', name: 'Fastify', category: 'backend' },
  { key: 'hono', name: 'Hono', category: 'backend' },
  { key: 'koa', name: 'Koa', category: 'backend' },
  { key: 'tailwindcss', name: 'Tailwind CSS', category: 'tooling' },
];

/**
 * Safely reads and parses a package.json file if present in the repository root.
 */
export async function readPackageJson(repoDir: string): Promise<PackageJsonData | null> {
  const pkgPath = path.join(repoDir, 'package.json');
  try {
    const raw = await fs.promises.readFile(pkgPath, 'utf-8');
    return JSON.parse(raw) as PackageJsonData;
  } catch {
    return null;
  }
}

/**
 * Lists top-level directory names in the repository root, ignoring standard hidden/generated dirs.
 */
export async function getTopLevelDirectories(repoDir: string): Promise<string[]> {
  try {
    const entries = await fs.promises.readdir(repoDir, { withFileTypes: true });
    return entries
      .filter((e) => e.isDirectory() && !IGNORED_DIRECTORIES.has(e.name))
      .map((e) => e.name);
  } catch {
    return [];
  }
}

/**
 * Detects languages based on extension counts and ranks them deterministically.
 */
export function detectLanguages(
  extensionCounts: Record<string, number>,
  totalFileCount: number
): DetectedLanguage[] {
  const languageTotals: Record<string, number> = {};

  for (const [ext, count] of Object.entries(extensionCounts)) {
    const lang = EXTENSION_LANGUAGE_MAP[ext];
    if (lang && lang !== 'Markdown') {
      languageTotals[lang] = (languageTotals[lang] || 0) + count;
    }
  }

  const codeFilesCount = Object.values(languageTotals).reduce((a, b) => a + b, 0);
  if (codeFilesCount === 0) {
    if (extensionCounts['.md']) {
      return [{ name: 'Markdown', confidence: 'high', fileCount: extensionCounts['.md'] }];
    }
    return [];
  }

  const sortedLangs = Object.entries(languageTotals)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  return sortedLangs.map((item) => {
    const ratio = item.count / codeFilesCount;
    let confidence: 'high' | 'medium' | 'low' = 'low';
    if (ratio >= 0.4) {
      confidence = 'high';
    } else if (ratio >= 0.15) {
      confidence = 'medium';
    }

    return {
      name: item.name,
      confidence,
      fileCount: item.count,
    };
  });
}

/**
 * Detects package manager from detected lockfiles or config files.
 */
export function detectPackageManager(detectedFiles: string[]): string | null {
  const fileSet = new Set(detectedFiles);

  if (fileSet.has('pnpm-lock.yaml')) return 'pnpm';
  if (fileSet.has('package-lock.json')) return 'npm';
  if (fileSet.has('yarn.lock')) return 'yarn';
  if (fileSet.has('bun.lockb') || fileSet.has('bun.lock')) return 'bun';
  if (fileSet.has('poetry.lock') || fileSet.has('Pipfile.lock') || fileSet.has('requirements.txt'))
    return 'pip';
  if (fileSet.has('Cargo.lock')) return 'cargo';
  if (fileSet.has('go.mod')) return 'go modules';
  if (fileSet.has('pom.xml')) return 'maven';
  if (fileSet.has('build.gradle') || fileSet.has('build.gradle.kts')) return 'gradle';

  return null;
}

/**
 * Detects frameworks based on package.json dependencies and config file markers.
 */
export function detectFrameworks(
  pkgData: PackageJsonData | null,
  detectedFiles: string[]
): DetectedFramework[] {
  const frameworks: DetectedFramework[] = [];
  const addedNames = new Set<string>();

  const allDeps = {
    ...(pkgData?.dependencies || {}),
    ...(pkgData?.devDependencies || {}),
  };

  for (const rule of FRAMEWORK_DEPENDENCY_RULES) {
    if (allDeps[rule.key]) {
      frameworks.push({
        name: rule.name,
        confidence: 'high',
        category: rule.category,
      });
      addedNames.add(rule.name);
    }
  }

  // Check config files if not already detected from dependencies
  const fileSet = new Set(detectedFiles);
  if (!addedNames.has('Vite') && Array.from(fileSet).some((f) => /^vite\.config\./i.test(f))) {
    frameworks.push({ name: 'Vite', confidence: 'medium', category: 'tooling' });
  }
  if (!addedNames.has('Next.js') && Array.from(fileSet).some((f) => /^next\.config\./i.test(f))) {
    frameworks.push({ name: 'Next.js', confidence: 'medium', category: 'fullstack' });
  }

  return frameworks;
}

/**
 * Detects application architecture type deterministically.
 */
export function detectAppType(
  pkgData: PackageJsonData | null,
  topDirs: string[],
  frameworks: DetectedFramework[],
  detectedFiles: string[]
): string {
  const topDirSet = new Set(topDirs.map((d) => d.toLowerCase()));
  const fileSet = new Set(detectedFiles);

  // Monorepo check
  if (
    (topDirSet.has('apps') && topDirSet.has('packages')) ||
    (pkgData?.workspaces &&
      (Array.isArray(pkgData.workspaces)
        ? pkgData.workspaces.length > 0
        : Boolean(pkgData.workspaces.packages)))
  ) {
    return 'monorepo';
  }

  const frameworkCategories = new Set(frameworks.map((f) => f.category));

  // Full-stack check
  if (
    frameworkCategories.has('fullstack') ||
    (frameworkCategories.has('frontend') && frameworkCategories.has('backend')) ||
    ((topDirSet.has('web') || topDirSet.has('client')) &&
      (topDirSet.has('api') || topDirSet.has('server')))
  ) {
    return 'full-stack app';
  }

  // Backend API check
  if (
    frameworkCategories.has('backend') ||
    topDirSet.has('routes') ||
    topDirSet.has('controllers') ||
    topDirSet.has('api')
  ) {
    return 'backend API';
  }

  // Frontend app check
  if (frameworkCategories.has('frontend') || frameworkCategories.has('tooling')) {
    return 'frontend app';
  }

  // CLI tool check
  if (pkgData?.bin) {
    return 'CLI tool';
  }

  // Documentation / Static site check
  if (fileSet.has('README.md') && topDirs.length === 0) {
    return 'documentation site';
  }

  // Library / Package check
  if (pkgData && !pkgData.private) {
    return 'library/package';
  }

  return 'general application';
}

/**
 * Extracts API surface hints based on file names, entrypoints, and directory structure.
 */
export function detectApiSurfaceHints(
  topDirs: string[],
  detectedFiles: string[],
  frameworks: DetectedFramework[]
): string[] {
  const hints: string[] = [];
  const topDirSet = new Set(topDirs.map((d) => d.toLowerCase()));
  const frameworkNames = new Set(frameworks.map((f) => f.name));

  if (topDirSet.has('routes')) {
    hints.push('Routes directory detected (routes/)');
  }
  if (topDirSet.has('controllers')) {
    hints.push('Controllers directory detected (controllers/)');
  }
  if (topDirSet.has('handlers')) {
    hints.push('Event/Request handlers directory detected (handlers/)');
  }
  if (topDirSet.has('api')) {
    hints.push('Dedicated API directory detected (api/)');
  }

  if (frameworkNames.has('Express')) {
    hints.push('Express HTTP framework endpoint structure');
  }
  if (frameworkNames.has('Next.js')) {
    hints.push('Next.js API route structure');
  }
  if (frameworkNames.has('NestJS')) {
    hints.push('NestJS controller module structure');
  }
  if (frameworkNames.has('Fastify')) {
    hints.push('Fastify route registration structure');
  }
  if (frameworkNames.has('Hono')) {
    hints.push('Hono lightweight web framework routes');
  }

  if (hints.length === 0) {
    hints.push('No explicit API routes or controllers detected');
  }

  return hints;
}

/**
 * Extracts architecture hints from directory layout and infrastructure files.
 */
export function detectArchitectureHints(
  topDirs: string[],
  detectedFiles: string[],
  appType: string
): string[] {
  const hints: string[] = [];
  const topDirSet = new Set(topDirs.map((d) => d.toLowerCase()));
  const fileSet = new Set(detectedFiles);

  if (appType === 'monorepo') {
    hints.push('Monorepo workspace layout (apps/ + packages/)');
  }
  if (topDirSet.has('web') && topDirSet.has('api')) {
    hints.push('Decoupled client/server separation (apps/web + apps/api)');
  }
  if (fileSet.has('Dockerfile') || fileSet.has('docker-compose.yml') || fileSet.has('docker-compose.yaml')) {
    hints.push('Containerized deployment configuration (Docker)');
  }
  if (topDirSet.has('services')) {
    hints.push('Service-oriented internal directory layout');
  }
  if (topDirSet.has('packages') || topDirSet.has('shared')) {
    hints.push('Shared package/module architectural boundary');
  }

  if (hints.length === 0) {
    hints.push('Standard single-package project architecture');
  }

  return hints;
}

/**
 * Generates a concise, deterministic summary sentence for the repository.
 */
export function generateSummary(
  languages: DetectedLanguage[],
  frameworks: DetectedFramework[],
  packageManager: string | null,
  appType: string
): string {
  const mainLang = languages.length > 0 ? languages[0].name : 'Source';
  const frameworkList = frameworks.map((f) => f.name).join(' and ');
  const pmPart = packageManager ? ` Managed with ${packageManager}.` : '';

  if (frameworkList) {
    return `${mainLang} ${appType} built with ${frameworkList}.${pmPart}`;
  }

  return `${mainLang} ${appType}.${pmPart}`;
}

/**
 * Main entry point: Performs rule-based analysis on cloned repository directory and metadata.
 */
export async function analyzeRepositoryIntelligence(
  repoDir: string,
  metadata: RepositoryMetadata
): Promise<RepositoryIntelligence> {
  const pkgData = await readPackageJson(repoDir);
  const topDirs = await getTopLevelDirectories(repoDir);

  const detectedLanguages = detectLanguages(metadata.extensionCounts, metadata.fileCount);
  const detectedPackageManager = detectPackageManager(metadata.detectedFiles);
  const detectedFrameworks = detectFrameworks(pkgData, metadata.detectedFiles);
  const detectedAppType = detectAppType(
    pkgData,
    topDirs,
    detectedFrameworks,
    metadata.detectedFiles
  );
  const apiSurfaceHints = detectApiSurfaceHints(topDirs, metadata.detectedFiles, detectedFrameworks);
  const architectureHints = detectArchitectureHints(topDirs, metadata.detectedFiles, detectedAppType);
  const summary = generateSummary(
    detectedLanguages,
    detectedFrameworks,
    detectedPackageManager,
    detectedAppType
  );

  return {
    fileCount: metadata.fileCount,
    directoryCount: metadata.directoryCount,
    totalBytes: metadata.totalBytes,
    extensionCounts: metadata.extensionCounts,
    detectedFiles: metadata.detectedFiles,
    detectedLanguages,
    detectedFrameworks,
    detectedPackageManager,
    detectedAppType,
    apiSurfaceHints,
    architectureHints,
    summary,
  };
}
