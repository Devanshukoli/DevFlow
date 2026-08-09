import fs from 'node:fs';
import path from 'node:path';
import { RepositoryDependency, DependencyType } from '@devflow/shared';
import { IGNORED_DIRECTORIES } from './repo-inspector.js';

export interface ExtractedDependencyIntelligence {
  dependencies: RepositoryDependency[];
  dependencyCount: number;
  productionDependencyCount: number;
  developmentDependencyCount: number;
  optionalDependencyCount: number;
  peerDependencyCount: number;
  dependencyManifests: string[];
}

const MAX_MANIFEST_SIZE_BYTES = 1024 * 1024; // 1MB safety cap

/**
 * Checks if a filename matches a known dependency manifest pattern.
 */
export function isDependencyManifestFile(fileName: string): boolean {
  const lower = fileName.toLowerCase();
  if (lower === 'package.json') return true;
  if (lower === 'cargo.toml') return true;
  if (lower === 'go.mod') return true;
  if (lower === 'pom.xml') return true;
  if (lower === 'pyproject.toml') return true;
  if (lower.startsWith('requirements') && lower.endsWith('.txt')) return true;
  return false;
}

/**
 * Parses a package.json file safely.
 */
export function parsePackageJsonManifest(content: string, sourcePath: string): RepositoryDependency[] {
  const deps: RepositoryDependency[] = [];
  try {
    const pkg = JSON.parse(content);

    const extractGroup = (group: Record<string, string> | undefined, depType: DependencyType) => {
      if (!group || typeof group !== 'object') return;
      for (const [name, rawVersion] of Object.entries(group)) {
        if (typeof name === 'string' && name.trim()) {
          deps.push({
            name: name.trim(),
            version: typeof rawVersion === 'string' ? rawVersion.trim() : '*',
            type: depType,
            source: sourcePath,
          });
        }
      }
    };

    extractGroup(pkg.dependencies, 'production');
    extractGroup(pkg.devDependencies, 'development');
    extractGroup(pkg.optionalDependencies, 'optional');
    extractGroup(pkg.peerDependencies, 'peer');
  } catch {
    // Malformed JSON is safely ignored
  }
  return deps;
}

/**
 * Parses a Cargo.toml file safely.
 */
export function parseCargoTomlManifest(content: string, sourcePath: string): RepositoryDependency[] {
  const deps: RepositoryDependency[] = [];
  try {
    const lines = content.split('\n');
    let currentSection: 'dependencies' | 'dev-dependencies' | 'build-dependencies' | 'other' = 'other';

    for (const rawLine of lines) {
      const line = rawLine.trim();

      // Check section headers
      if (line.startsWith('[') && line.endsWith(']')) {
        const sectionName = line.slice(1, -1).trim();
        if (sectionName === 'dependencies' || sectionName.startsWith('dependencies.')) {
          currentSection = 'dependencies';
        } else if (
          sectionName === 'dev-dependencies' ||
          sectionName.startsWith('dev-dependencies.') ||
          sectionName === 'build-dependencies' ||
          sectionName.startsWith('build-dependencies.')
        ) {
          currentSection = 'dev-dependencies';
        } else {
          currentSection = 'other';
        }
        continue;
      }

      if (currentSection === 'other' || !line || line.startsWith('#')) {
        continue;
      }

      // Match key = value lines e.g. serde = "1.0" or serde = { version = "1.0" }
      const eqIdx = line.indexOf('=');
      if (eqIdx > 0) {
        const depName = line.slice(0, eqIdx).trim();
        const valuePart = line.slice(eqIdx + 1).trim();

        if (depName && !depName.includes(' ') && valuePart) {
          let version = '*';
          const versionMatch = valuePart.match(/version\s*=\s*["']([^"']+)["']/i);
          if (versionMatch) {
            version = versionMatch[1];
          } else {
            const simpleVersionMatch = valuePart.match(/^["']([^"']+)["']/);
            if (simpleVersionMatch) {
              version = simpleVersionMatch[1];
            }
          }

          const type: DependencyType =
            currentSection === 'dependencies' ? 'production' : 'development';

          deps.push({
            name: depName,
            version,
            type,
            source: sourcePath,
          });
        }
      }
    }
  } catch {
    // Malformed content safely ignored
  }
  return deps;
}

/**
 * Parses requirements.txt (and variants) safely.
 */
export function parseRequirementsTxtManifest(
  content: string,
  sourcePath: string
): RepositoryDependency[] {
  const deps: RepositoryDependency[] = [];
  try {
    const isDev = sourcePath.toLowerCase().includes('dev') || sourcePath.toLowerCase().includes('test');
    const type: DependencyType = isDev ? 'development' : 'production';
    const lines = content.split('\n');

    for (const rawLine of lines) {
      let line = rawLine.trim();
      // Remove inline comments
      const commentIdx = line.indexOf('#');
      if (commentIdx !== -1) {
        line = line.slice(0, commentIdx).trim();
      }

      if (!line || line.startsWith('-') || line.startsWith('http://') || line.startsWith('https://')) {
        continue;
      }

      // Match e.g. fastapi==0.115.0, requests>=2.31, numpy
      const match = line.match(/^([a-zA-Z0-9_\-\.]+)\s*([~=><!^;].*)?$/);
      if (match) {
        const name = match[1].trim();
        const version = match[2] ? match[2].trim() : '*';
        deps.push({
          name,
          version,
          type,
          source: sourcePath,
        });
      }
    }
  } catch {
    // Malformed content safely ignored
  }
  return deps;
}

/**
 * Parses pyproject.toml safely.
 */
export function parsePyprojectTomlManifest(content: string, sourcePath: string): RepositoryDependency[] {
  const deps: RepositoryDependency[] = [];
  try {
    const lines = content.split('\n');
    let currentSection: 'dependencies' | 'dev-dependencies' | 'other' = 'other';
    let inArray = false;

    for (const rawLine of lines) {
      const line = rawLine.trim();

      if (line.startsWith('[') && line.endsWith(']')) {
        inArray = false;
        const sectionName = line.slice(1, -1).trim().toLowerCase();
        if (
          sectionName === 'tool.poetry.dependencies' ||
          sectionName === 'project.dependencies'
        ) {
          currentSection = 'dependencies';
        } else if (
          sectionName.includes('dev') ||
          sectionName.includes('test') ||
          sectionName === 'tool.poetry.group.dev.dependencies'
        ) {
          currentSection = 'dev-dependencies';
        } else {
          currentSection = 'other';
        }
        continue;
      }

      if (currentSection === 'other' || !line || line.startsWith('#')) {
        continue;
      }

      // PEP 621 dependencies array format: dependencies = ["requests>=2.0", "fastapi"]
      if (line.startsWith('dependencies = [') || line.startsWith('dependencies=[')) {
        inArray = true;
        continue;
      }

      if (inArray) {
        if (line.includes(']')) {
          inArray = false;
        }
        const itemMatch = line.match(/["']([^"']+)["']/);
        if (itemMatch) {
          const spec = itemMatch[1].trim();
          const specMatch = spec.match(/^([a-zA-Z0-9_\-\.]+)\s*([~=><!^;].*)?$/);
          if (specMatch) {
            deps.push({
              name: specMatch[1].trim(),
              version: specMatch[2] ? specMatch[2].trim() : '*',
              type: currentSection === 'dev-dependencies' ? 'development' : 'production',
              source: sourcePath,
            });
          }
        }
        continue;
      }

      // Poetry TOML key-value style: requests = "^2.28" or requests = { version = "^2.28" }
      const eqIdx = line.indexOf('=');
      if (eqIdx > 0) {
        const depName = line.slice(0, eqIdx).trim();
        const valuePart = line.slice(eqIdx + 1).trim();

        if (depName && !depName.includes(' ') && valuePart) {
          if (depName.toLowerCase() === 'python') continue; // Skip python runtime spec

          let version = '*';
          const versionMatch = valuePart.match(/version\s*=\s*["']([^"']+)["']/i);
          if (versionMatch) {
            version = versionMatch[1];
          } else {
            const simpleVersionMatch = valuePart.match(/^["']([^"']+)["']/);
            if (simpleVersionMatch) {
              version = simpleVersionMatch[1];
            }
          }

          deps.push({
            name: depName,
            version,
            type: currentSection === 'dev-dependencies' ? 'development' : 'production',
            source: sourcePath,
          });
        }
      }
    }
  } catch {
    // Malformed content safely ignored
  }
  return deps;
}

/**
 * Parses go.mod safely.
 */
export function parseGoModManifest(content: string, sourcePath: string): RepositoryDependency[] {
  const deps: RepositoryDependency[] = [];
  try {
    const lines = content.split('\n');
    let inRequireBlock = false;

    for (const rawLine of lines) {
      const line = rawLine.trim();

      if (line.startsWith('require (')) {
        inRequireBlock = true;
        continue;
      }

      if (inRequireBlock) {
        if (line === ')') {
          inRequireBlock = false;
          continue;
        }
        if (!line || line.startsWith('//')) continue;

        const parts = line.split(/\s+/);
        if (parts.length >= 2) {
          deps.push({
            name: parts[0],
            version: parts[1],
            type: 'production',
            source: sourcePath,
          });
        }
        continue;
      }

      // Single line require e.g. require github.com/gin-gonic/gin v1.9.1
      if (line.startsWith('require ')) {
        const parts = line.replace(/^require\s+/, '').split(/\s+/);
        if (parts.length >= 2) {
          deps.push({
            name: parts[0],
            version: parts[1],
            type: 'production',
            source: sourcePath,
          });
        }
      }
    }
  } catch {
    // Malformed content safely ignored
  }
  return deps;
}

/**
 * Parses pom.xml safely.
 */
export function parsePomXmlManifest(content: string, sourcePath: string): RepositoryDependency[] {
  const deps: RepositoryDependency[] = [];
  try {
    const dependencyRegex = /<dependency>([\s\S]*?)<\/dependency>/gi;
    let match: RegExpExecArray | null;

    while ((match = dependencyRegex.exec(content)) !== null) {
      const block = match[1];
      const groupIdMatch = block.match(/<groupId>([^<]+)<\/groupId>/i);
      const artifactIdMatch = block.match(/<artifactId>([^<]+)<\/artifactId>/i);
      const versionMatch = block.match(/<version>([^<]+)<\/version>/i);
      const scopeMatch = block.match(/<scope>([^<]+)<\/scope>/i);

      if (artifactIdMatch) {
        const artifactId = artifactIdMatch[1].trim();
        const groupId = groupIdMatch ? groupIdMatch[1].trim() : '';
        const name = groupId ? `${groupId}:${artifactId}` : artifactId;
        const version = versionMatch ? versionMatch[1].trim() : '*';
        const scope = scopeMatch ? scopeMatch[1].trim().toLowerCase() : '';

        const type: DependencyType = scope === 'test' ? 'development' : 'production';

        deps.push({
          name,
          version,
          type,
          source: sourcePath,
        });
      }
    }
  } catch {
    // Malformed content safely ignored
  }
  return deps;
}

/**
 * Traverses a local cloned repository directory and extracts dependency intelligence.
 */
export async function extractDependencyIntelligence(
  repoDir: string
): Promise<ExtractedDependencyIntelligence> {
  const allDependencies: RepositoryDependency[] = [];
  const manifestPaths: string[] = [];

  async function walk(currentDir: string) {
    const entries = await fs.promises.readdir(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (IGNORED_DIRECTORIES.has(entry.name)) {
          continue;
        }
        await walk(path.join(currentDir, entry.name));
      } else if (entry.isFile()) {
        if (isDependencyManifestFile(entry.name)) {
          const fullPath = path.join(currentDir, entry.name);
          const relativePath = path.relative(repoDir, fullPath).replace(/\\/g, '/');

          try {
            const stats = await fs.promises.stat(fullPath);
            if (stats.size > MAX_MANIFEST_SIZE_BYTES) {
              // Skip oversized manifest safely
              continue;
            }

            const content = await fs.promises.readFile(fullPath, 'utf-8');
            let fileDeps: RepositoryDependency[] = [];

            const lowerName = entry.name.toLowerCase();
            if (lowerName === 'package.json') {
              fileDeps = parsePackageJsonManifest(content, relativePath);
            } else if (lowerName === 'cargo.toml') {
              fileDeps = parseCargoTomlManifest(content, relativePath);
            } else if (lowerName.startsWith('requirements') && lowerName.endsWith('.txt')) {
              fileDeps = parseRequirementsTxtManifest(content, relativePath);
            } else if (lowerName === 'pyproject.toml') {
              fileDeps = parsePyprojectTomlManifest(content, relativePath);
            } else if (lowerName === 'go.mod') {
              fileDeps = parseGoModManifest(content, relativePath);
            } else if (lowerName === 'pom.xml') {
              fileDeps = parsePomXmlManifest(content, relativePath);
            }

            if (fileDeps.length > 0 || isDependencyManifestFile(entry.name)) {
              manifestPaths.push(relativePath);
              allDependencies.push(...fileDeps);
            }
          } catch {
            // Unreadable or error reading file, safely continue
          }
        }
      }
    }
  }

  await walk(repoDir);

  manifestPaths.sort();

  let productionDependencyCount = 0;
  let developmentDependencyCount = 0;
  let optionalDependencyCount = 0;
  let peerDependencyCount = 0;

  for (const dep of allDependencies) {
    if (dep.type === 'production') productionDependencyCount++;
    else if (dep.type === 'development') developmentDependencyCount++;
    else if (dep.type === 'optional') optionalDependencyCount++;
    else if (dep.type === 'peer') peerDependencyCount++;
  }

  return {
    dependencies: allDependencies,
    dependencyCount: allDependencies.length,
    productionDependencyCount,
    developmentDependencyCount,
    optionalDependencyCount,
    peerDependencyCount,
    dependencyManifests: manifestPaths,
  };
}
