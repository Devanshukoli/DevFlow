import fs from 'node:fs';
import path from 'node:path';

export interface RepositoryMetadata {
  fileCount: number;
  directoryCount: number;
  totalBytes: number;
  extensionCounts: Record<string, number>;
  detectedFiles: string[];
}

export const IGNORED_DIRECTORIES = new Set([
  '.git',
  'node_modules',
  'dist',
  'build',
  'coverage',
  '.next',
  '.cache',
  '.turbo',
]);

export const COMMON_PROJECT_FILE_PATTERNS = [
  'package.json',
  'pnpm-lock.yaml',
  'package-lock.json',
  'yarn.lock',
  'tsconfig.json',
  'Dockerfile',
  'docker-compose.yml',
  'docker-compose.yaml',
  'README.md',
  '.env.example',
  '.gitignore',
];

/**
 * Checks if a filename matches standard project config names or patterns (e.g., vite.config.ts, next.config.mjs).
 */
export function isCommonProjectFile(fileName: string): boolean {
  if (COMMON_PROJECT_FILE_PATTERNS.includes(fileName)) {
    return true;
  }
  if (/^vite\.config\.[a-z0-9]+$/i.test(fileName)) {
    return true;
  }
  if (/^next\.config\.[a-z0-9]+$/i.test(fileName)) {
    return true;
  }
  return false;
}

/**
 * Recursively inspects a local repository directory and extracts deterministic metadata.
 */
export async function inspectRepository(repoDir: string): Promise<RepositoryMetadata> {
  let fileCount = 0;
  let directoryCount = 0;
  let totalBytes = 0;
  const extensionCounts: Record<string, number> = {};
  const detectedFilesSet = new Set<string>();

  async function walk(currentDir: string) {
    const entries = await fs.promises.readdir(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (IGNORED_DIRECTORIES.has(entry.name)) {
          continue;
        }
        directoryCount++;
        await walk(path.join(currentDir, entry.name));
      } else if (entry.isFile()) {
        fileCount++;

        const entryPath = path.join(currentDir, entry.name);
        try {
          const stats = await fs.promises.stat(entryPath);
          totalBytes += stats.size;
        } catch {
          // Ignore unreadable file stats
        }

        // Extension counting
        const ext = path.extname(entry.name).toLowerCase();
        const extKey = ext ? ext : '[no-extension]';
        extensionCounts[extKey] = (extensionCounts[extKey] || 0) + 1;

        // Common project file detection
        if (isCommonProjectFile(entry.name)) {
          detectedFilesSet.add(entry.name);
        }
      }
    }
  }

  await walk(repoDir);

  return {
    fileCount,
    directoryCount,
    totalBytes,
    extensionCounts,
    detectedFiles: Array.from(detectedFilesSet).sort(),
  };
}
