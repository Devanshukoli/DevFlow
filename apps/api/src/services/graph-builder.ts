import { getAnalysisResultByJobId } from './analysis-service.js';
import { getGraphInstance } from '../lib/falkordb.js';

interface GraphLimits {
  maxFiles: number;
  maxDirectories: number;
  maxDepth: number;
  maxNodes: number;
}

export interface GraphStats {
  nodes: number;
  relationships: number;
  labels: Record<string, number>;
  types: Record<string, number>;
  truncated: boolean;
}

/**
 * Extracts owner and name from a GitHub repository URL.
 */
function parseRepoUrl(url: string): { owner: string; name: string } {
  try {
    const trimmed = url.replace(/\/$/, '');
    const parts = trimmed.split('/');
    const name = parts[parts.length - 1] || 'unknown';
    const owner = parts[parts.length - 2] || 'unknown';
    return { owner, name };
  } catch {
    return { owner: 'unknown', name: 'unknown' };
  }
}

/**
 * Helper to get the deterministic graph name for a jobId.
 */
export function getGraphName(jobId: string): string {
  return `devflow_${jobId.replace(/-/g, '_')}`;
}

/**
 * Builds the repository knowledge graph in FalkorDB from a verified analysis result.
 * Idempotent: deletes previous graph projection before rebuilding.
 */
export async function buildGraph(jobId: string): Promise<GraphStats> {
  const result = await getAnalysisResultByJobId(jobId);
  if (!result) {
    throw new Error(`Analysis result not found for job: ${jobId}`);
  }

  const graphName = getGraphName(jobId);
  const graph = await getGraphInstance(graphName);

  // 1. Clear any existing graph projection for idempotency
  try {
    await graph.delete();
    console.log(`[graph-builder] Cleared existing graph: ${graphName}`);
  } catch (err) {
    // If graph didn't exist, ignore
  }

  const limits: GraphLimits = {
    maxFiles: 10000,
    maxDirectories: 2000,
    maxDepth: 8,
    maxNodes: 25000,
  };

  let graphTruncated = false;

  // 2. Identify files and directories to build with safety limits
  const filesToInsert: Array<{ path: string; name: string; extension: string; sizeBytes: number; lineCount: number }> = [];
  const dirsToInsert = new Set<string>();

  const detectedFiles = result.detectedFiles || [];
  for (const filePath of detectedFiles) {
    const parts = filePath.split('/');
    if (parts.length > limits.maxDepth) {
      graphTruncated = true;
      continue;
    }
    if (filesToInsert.length >= limits.maxFiles) {
      graphTruncated = true;
      break;
    }

    const name = parts[parts.length - 1];
    const dotIndex = name.lastIndexOf('.');
    const extension = dotIndex !== -1 ? name.substring(dotIndex + 1) : '';

    filesToInsert.push({
      path: filePath,
      name,
      extension,
      sizeBytes: 0, // Deterministic files from detectedFiles may not have size readily available
      lineCount: 0,
    });

    // Extract intermediate directories
    let currentDir = '';
    for (let i = 0; i < parts.length - 1; i++) {
      currentDir = currentDir ? `${currentDir}/${parts[i]}` : parts[i];
      if (dirsToInsert.size >= limits.maxDirectories) {
        graphTruncated = true;
        break;
      }
      dirsToInsert.add(currentDir);
    }
  }

  const { owner, name: repoName } = parseRepoUrl(result.repositoryUrl);
  const repoNodeId = `repository:${jobId}`;

  console.log(`[graph-builder] Building graph for ${result.repositoryUrl}. Files: ${filesToInsert.length}, Dirs: ${dirsToInsert.size}`);

  // Create Repository Node
  await graph.query(
    `MERGE (r:Repository {id: $id})
     ON CREATE SET r.jobId = $jobId,
                   r.repositoryUrl = $repositoryUrl,
                   r.owner = $owner,
                   r.name = $name,
                   r.analyzedAt = $analyzedAt,
                   r.graphVersion = "1.0.0",
                   r.graphTruncated = $truncated,
                   r.graphBuiltAt = $builtAt`,
    {
      params: {
        id: repoNodeId,
        jobId,
        repositoryUrl: result.repositoryUrl,
        owner,
        name: repoName,
        analyzedAt: result.createdAt,
        truncated: graphTruncated,
        builtAt: new Date().toISOString(),
      },
    }
  );

  // Create Languages
  const languages = result.detectedLanguages || [];
  for (const lang of languages) {
    const langId = `language:${jobId}:${lang.name}`;
    await graph.query(
      `MERGE (l:Language {id: $id})
       ON CREATE SET l.name = $name, l.confidence = $confidence`,
      { params: { id: langId, name: lang.name, confidence: lang.confidence } }
    );
    await graph.query(
      `MATCH (r:Repository {id: $repoId}), (l:Language {id: $langId})
       MERGE (r)-[:USES_LANGUAGE]->(l)`,
      { params: { repoId: repoNodeId, langId } }
    );
  }

  // Create Frameworks
  const frameworks = result.detectedFrameworks || [];
  for (const fw of frameworks) {
    const fwId = `framework:${jobId}:${fw.name}`;
    await graph.query(
      `MERGE (f:Framework {id: $id})
       ON CREATE SET f.name = $name, f.confidence = $confidence`,
      { params: { id: fwId, name: fw.name, confidence: fw.confidence } }
    );
    await graph.query(
      `MATCH (r:Repository {id: $repoId}), (f:Framework {id: $fwId})
       MERGE (r)-[:USES_FRAMEWORK]->(f)`,
      { params: { repoId: repoNodeId, fwId } }
    );
  }

  // Create Workspaces
  const workspaces = result.architecture?.workspaceBoundaries || [];
  for (const ws of workspaces) {
    const wsId = `workspace:${jobId}:${ws.path}`;
    await graph.query(
      `MERGE (w:Workspace {id: $id})
       ON CREATE SET w.name = $name, w.path = $path, w.type = $type, w.language = $language`,
      {
        params: {
          id: wsId,
          name: ws.name,
          path: ws.path,
          type: ws.type,
          language: ws.detectedLanguage || 'unknown',
        },
      }
    );
    await graph.query(
      `MATCH (r:Repository {id: $repoId}), (w:Workspace {id: $wsId})
       MERGE (r)-[:CONTAINS_WORKSPACE]->(w)`,
      { params: { repoId: repoNodeId, wsId } }
    );

    // Link workspace to its language or framework
    if (ws.detectedLanguage) {
      const langId = `language:${jobId}:${ws.detectedLanguage}`;
      await graph.query(
        `MATCH (w:Workspace {id: $wsId}), (l:Language {id: $langId})
         MERGE (w)-[:USES_LANGUAGE]->(l)`,
        { params: { wsId, langId } }
      );
    }
    if (ws.detectedFramework) {
      const fwId = `framework:${jobId}:${ws.detectedFramework}`;
      await graph.query(
        `MATCH (w:Workspace {id: $wsId}), (f:Framework {id: $fwId})
         MERGE (w)-[:USES_FRAMEWORK]->(f)`,
        { params: { wsId, fwId } }
      );
    }
  }

  // Create Directories and Files (Hierarchical Structure)
  // Create directories first, ordered by depth so parents exist
  const sortedDirs = Array.from(dirsToInsert).sort((a, b) => a.split('/').length - b.split('/').length);
  for (const dirPath of sortedDirs) {
    const dirId = `directory:${jobId}:${dirPath}`;
    const parts = dirPath.split('/');
    const dirName = parts[parts.length - 1];
    const depth = parts.length;

    await graph.query(
      `MERGE (d:Directory {id: $id})
       ON CREATE SET d.path = $path, d.name = $name, d.depth = $depth`,
      { params: { id: dirId, path: dirPath, name: dirName, depth } }
    );

    // Link Directory to parent or Repository
    if (depth === 1) {
      await graph.query(
        `MATCH (r:Repository {id: $repoId}), (d:Directory {id: $dirId})
         MERGE (r)-[:CONTAINS_DIRECTORY]->(d)`,
        { params: { repoId: repoNodeId, dirId } }
      );
    } else {
      const parentPath = parts.slice(0, -1).join('/');
      const parentId = `directory:${jobId}:${parentPath}`;
      await graph.query(
        `MATCH (p:Directory {id: $parentId}), (c:Directory {id: $childId})
         MERGE (p)-[:CONTAINS_DIRECTORY]->(c)`,
        { params: { parentId, childId: dirId } }
      );
    }

    // Link Workspace to Directory if matching path
    const matchingWorkspace = workspaces.find((ws) => ws.path === dirPath);
    if (matchingWorkspace) {
      const wsId = `workspace:${jobId}:${matchingWorkspace.path}`;
      await graph.query(
        `MATCH (w:Workspace {id: $wsId}), (d:Directory {id: $dirId})
         MERGE (w)-[:CONTAINS_DIRECTORY]->(d)`,
        { params: { wsId, dirId } }
      );
    }
  }

  // Create Files and link to directories
  for (const file of filesToInsert) {
    const fileId = `file:${jobId}:${file.path}`;
    await graph.query(
      `MERGE (f:File {id: $id})
       ON CREATE SET f.path = $path, f.name = $name, f.extension = $extension, f.sizeBytes = $sizeBytes, f.lineCount = $lineCount`,
      {
        params: {
          id: fileId,
          path: file.path,
          name: file.name,
          extension: file.extension,
          sizeBytes: file.sizeBytes,
          lineCount: file.lineCount,
        },
      }
    );

    const parts = file.path.split('/');
    if (parts.length === 1) {
      await graph.query(
        `MATCH (r:Repository {id: $repoId}), (f:File {id: $fileId})
         MERGE (r)-[:CONTAINS_FILE]->(f)`,
        { params: { repoId: repoNodeId, fileId } }
      );
    } else {
      const parentPath = parts.slice(0, -1).join('/');
      const parentId = `directory:${jobId}:${parentPath}`;
      await graph.query(
        `MATCH (d:Directory {id: $parentId}), (f:File {id: $fileId})
         MERGE (d)-[:CONTAINS_FILE]->(f)`,
        { params: { parentId, fileId } }
      );
    }

    // Link Workspace to File if file path starts with workspace path
    const containingWorkspace = workspaces.find((ws) => file.path.startsWith(ws.path + '/'));
    if (containingWorkspace) {
      const wsId = `workspace:${jobId}:${containingWorkspace.path}`;
      await graph.query(
        `MATCH (w:Workspace {id: $wsId}), (f:File {id: $fileId})
         MERGE (w)-[:CONTAINS_FILE]->(f)`,
        { params: { wsId, fileId } }
      );
    }
  }

  // Create Package Manifests
  const manifests = result.dependencyManifests || [];
  for (const manifestPath of manifests) {
    const manifestId = `manifest:${jobId}:${manifestPath}`;
    const pm = result.detectedPackageManager || 'npm';
    const parts = manifestPath.split('/');
    const manifestType = parts.length === 1 ? 'root' : 'workspace';

    await graph.query(
      `MERGE (m:PackageManifest {id: $id})
       ON CREATE SET m.path = $path, m.packageManager = $packageManager, m.type = $type`,
      { params: { id: manifestId, path: manifestPath, packageManager: pm, type: manifestType } }
    );

    await graph.query(
      `MATCH (r:Repository {id: $repoId}), (m:PackageManifest {id: $manifestId})
       MERGE (r)-[:HAS_MANIFEST]->(m)`,
      { params: { repoId: repoNodeId, manifestId } }
    );

    // Link manifest to containing Workspace
    const containingWorkspace = workspaces.find((ws) => manifestPath.startsWith(ws.path + '/'));
    if (containingWorkspace) {
      const wsId = `workspace:${jobId}:${containingWorkspace.path}`;
      await graph.query(
        `MATCH (m:PackageManifest {id: $manifestId}), (w:Workspace {id: $wsId})
         MERGE (m)-[:BELONGS_TO]->(w)`,
        { params: { manifestId, wsId } }
      );
    }
  }

  // Create Packages and Link to Manifests and Workspaces
  const dependencies = result.dependencies || [];
  for (const dep of dependencies) {
    // Generate package id including manifest path to allow same packages declared in different manifests
    const packageId = `package:${jobId}:${dep.source}:${dep.name}`;
    await graph.query(
      `MERGE (p:Package {id: $id})
       ON CREATE SET p.name = $name, p.version = $version, p.type = $type`,
      { params: { id: packageId, name: dep.name, version: dep.version, type: dep.type } }
    );

    // Link repository
    await graph.query(
      `MATCH (r:Repository {id: $repoId}), (p:Package {id: $packageId})
       MERGE (r)-[:HAS_PACKAGE]->(p)`,
      { params: { repoId: repoNodeId, packageId } }
    );

    // Link to manifest
    const manifestId = `manifest:${jobId}:${dep.source}`;
    await graph.query(
      `MATCH (m:PackageManifest {id: $manifestId}), (p:Package {id: $packageId})
       MERGE (m)-[:DECLARES]->(p)`,
      { params: { manifestId, packageId } }
    );

    // Link Workspace to Package
    const containingWorkspace = workspaces.find((ws) => dep.source.startsWith(ws.path + '/'));
    if (containingWorkspace) {
      const wsId = `workspace:${jobId}:${containingWorkspace.path}`;
      await graph.query(
        `MATCH (w:Workspace {id: $wsId}), (p:Package {id: $packageId})
         MERGE (w)-[:HAS_PACKAGE]->(p)`,
        { params: { wsId, packageId } }
      );
    }
  }

  // Create ApiRoutes and links
  const routes = result.apiSurface?.routes || [];
  for (const rt of routes) {
    const routeId = `route:${jobId}:${rt.sourceFile}:${rt.method}:${rt.path || 'all'}`;
    await graph.query(
      `MERGE (rt:ApiRoute {id: $id})
       ON CREATE SET rt.path = $path, rt.method = $method, rt.framework = $framework, rt.filePath = $filePath, rt.lineNumber = $lineNumber`,
      {
        params: {
          id: routeId,
          path: rt.path || 'all',
          method: rt.method,
          framework: rt.framework,
          filePath: rt.sourceFile,
          lineNumber: rt.line || 1,
        },
      }
    );

    await graph.query(
      `MATCH (r:Repository {id: $repoId}), (rt:ApiRoute {id: $routeId})
       MERGE (r)-[:EXPOSES_ROUTE]->(rt)`,
      { params: { repoId: repoNodeId, routeId } }
    );

    // Link ApiRoute to defined File
    const fileId = `file:${jobId}:${rt.sourceFile}`;
    await graph.query(
      `MATCH (rt:ApiRoute {id: $routeId}), (f:File {id: $fileId})
       MERGE (rt)-[:DEFINED_IN]->(f)`,
      { params: { routeId, fileId } }
    );

    // Link ApiRoute to defined Workspace
    const containingWorkspace = workspaces.find((ws) => rt.sourceFile.startsWith(ws.path + '/'));
    if (containingWorkspace) {
      const wsId = `workspace:${jobId}:${containingWorkspace.path}`;
      await graph.query(
        `MATCH (rt:ApiRoute {id: $routeId}), (w:Workspace {id: $wsId})
         MERGE (rt)-[:BELONGS_TO]->(w)`,
        { params: { routeId, wsId } }
      );
    }

    // Link ApiRoute to defined Framework
    const fwId = `framework:${jobId}:${rt.framework}`;
    await graph.query(
      `MATCH (rt:ApiRoute {id: $routeId}), (f:Framework {id: $fwId})
       MERGE (rt)-[:USES_FRAMEWORK]->(f)`,
      { params: { routeId, fwId } }
    );
  }

  // Create ArchitectureSignals and links
  const archSignals = result.architecture?.signals || [];
  for (const signal of archSignals) {
    const signalId = `signal:${jobId}:${signal.name}`;
    await graph.query(
      `MERGE (as:ArchitectureSignal {id: $id})
       ON CREATE SET as.name = $name, as.confidence = "high"`,
      { params: { id: signalId, name: signal.name } }
    );

    await graph.query(
      `MATCH (r:Repository {id: $repoId}), (as:ArchitectureSignal {id: $signalId})
       MERGE (r)-[:HAS_ARCHITECTURE_SIGNAL]->(as)`,
      { params: { repoId: repoNodeId, signalId } }
    );

    // Link to files or directories if referenced in description or path (we can look for matching workspace boundaries or files)
    // Find directories/files supporting this signal
    const matchingDirs = sortedDirs.filter((dPath) => dPath.toLowerCase().includes(signal.name.toLowerCase()));
    for (const dPath of matchingDirs) {
      const dirId = `directory:${jobId}:${dPath}`;
      await graph.query(
        `MATCH (as:ArchitectureSignal {id: $signalId}), (d:Directory {id: $dirId})
         MERGE (as)-[:SUPPORTED_BY]->(d)`,
        { params: { signalId, dirId } }
      );
    }
  }

  // Create HealthFindings and links
  const findings = result.engineeringHealth?.findings || [];
  for (const finding of findings) {
    const findingId = `finding:${jobId}:${finding.id}`;
    await graph.query(
      `MERGE (hf:HealthFinding {id: $id})
       ON CREATE SET hf.idProp = $findingId,
                     hf.category = $category,
                     hf.severity = $severity,
                     hf.title = $title,
                     hf.scoreImpact = $scoreImpact`,
      {
        params: {
          id: findingId,
          findingId: finding.id,
          category: finding.category,
          severity: finding.severity,
          title: finding.title,
          scoreImpact: finding.scoreImpact,
        },
      }
    );

    await graph.query(
      `MATCH (r:Repository {id: $repoId}), (hf:HealthFinding {id: $findingId})
       MERGE (r)-[:HAS_HEALTH_FINDING]->(hf)`,
      { params: { repoId: repoNodeId, findingId } }
    );

    // Link evidence files or directories
    const evidences = finding.evidence || [];
    for (const ev of evidences) {
      // Check if evidence is a file
      if (detectedFiles.includes(ev)) {
        const fileId = `file:${jobId}:${ev}`;
        await graph.query(
          `MATCH (hf:HealthFinding {id: $findingId}), (f:File {id: $fileId})
           MERGE (hf)-[:EVIDENCE_FROM]->(f)`,
          { params: { findingId, fileId } }
        );
      } else {
        // Check if evidence starts with workspace/directory
        const matchingDir = sortedDirs.find((d) => d === ev || ev.startsWith(d + '/'));
        if (matchingDir) {
          const dirId = `directory:${jobId}:${matchingDir}`;
          await graph.query(
            `MATCH (hf:HealthFinding {id: $findingId}), (d:Directory {id: $dirId})
             MERGE (hf)-[:EVIDENCE_FROM]->(d)`,
            { params: { findingId, dirId } }
          );
        }
      }
    }
  }

  // Create TestingFrameworks
  const testFrameworks = result.engineeringHealth?.metrics?.detectedTestingFrameworks || [];
  for (const tfName of testFrameworks) {
    const tfId = `testing:${jobId}:${tfName}`;
    await graph.query(
      `MERGE (tf:TestingFramework {id: $id})
       ON CREATE SET tf.name = $name`,
      { params: { id: tfId, name: tfName } }
    );
    await graph.query(
      `MATCH (r:Repository {id: $repoId}), (tf:TestingFramework {id: $tfId})
       MERGE (r)-[:USES_TEST_FRAMEWORK]->(tf)`,
      { params: { repoId: repoNodeId, tfId } }
    );
  }

  // 3. Compute detailed statistics to store on Repository node and return
  const totalNodesReply = await graph.query<any>(`MATCH (n) RETURN count(n) as count`);
  const totalNodes = Number(totalNodesReply.data?.[0]?.count ?? 0);

  const totalRelsReply = await graph.query<any>(`MATCH ()-[r]->() RETURN count(r) as count`);
  const totalRels = Number(totalRelsReply.data?.[0]?.count ?? 0);

  // Labels breakdown
  const labelCounts: Record<string, number> = {};
  const labelsReply = await graph.query<any>(`MATCH (n) RETURN labels(n) as labels, count(n) as count`);
  const labelsData = labelsReply.data || [];
  for (const item of labelsData) {
    const rawLabels = item.labels || [];
    const count = Number(item.count || 0);
    for (const label of rawLabels) {
      labelCounts[label] = (labelCounts[label] || 0) + count;
    }
  }

  // Relationship types breakdown
  const typeCounts: Record<string, number> = {};
  const typesReply = await graph.query<any>(`MATCH ()-[r]->() RETURN type(r) as type, count(r) as count`);
  const typesData = typesReply.data || [];
  for (const item of typesData) {
    const type = item.type;
    const count = Number(item.count || 0);
    if (type) {
      typeCounts[type] = count;
    }
  }

  // Update repository metadata with results
  await graph.query(
    `MATCH (r:Repository {id: $id})
     SET r.graphNodeCount = $nodeCount,
         r.graphRelationshipCount = $relCount`,
    {
      params: {
        id: repoNodeId,
        nodeCount: totalNodes,
        relCount: totalRels,
      },
    }
  );

  return {
    nodes: totalNodes,
    relationships: totalRels,
    labels: labelCounts,
    types: typeCounts,
    truncated: graphTruncated,
  };
}
