import { getGraphInstance } from "../lib/falkordb.js";

export interface GraphFact {
  type: string;
  [key: string]: any;
}

export interface StructuredContext {
  repository: {
    owner: string;
    name: string;
  };
  questionIntent: string;
  facts: GraphFact[];
  contextTruncated: boolean;
  metadata?: {
    factsCount: number;
    relationshipsCount: number;
    queryType: string;
  };
}

/**
 * Classifies a user question into a deterministic intent.
 */
export function classifyQuestion(question: string): string {
  const q = question.toLowerCase();

  if (
    q.includes("framework") ||
    q.includes("react") ||
    q.includes("next.js") ||
    q.includes("express") ||
    q.includes("angular") ||
    q.includes("vue")
  ) {
    return "frameworks";
  }
  if (
    q.includes("language") ||
    q.includes("typescript") ||
    q.includes("javascript") ||
    q.includes("written in") ||
    q.includes("python") ||
    q.includes("go") ||
    q.includes("rust")
  ) {
    return "languages";
  }
  if (
    q.includes("package") ||
    q.includes("packages") ||
    q.includes("package manager") ||
    q.includes("package.json") ||
    q.includes("dependencies") ||
    q.includes("dependency") ||
    q.includes("npm") ||
    q.includes("yarn") ||
    q.includes("pnpm")
  ) {
    if (
      q.includes("use") ||
      q.includes("uses") ||
      q.includes("apps/") ||
      q.includes("packages/")
    ) {
      return "package_usage";
    }
    return "dependencies";
  }
  if (
    q.includes("workspace") ||
    q.includes("workspaces") ||
    q.includes("monorepo")
  ) {
    return "workspace_structure";
  }
  if (
    q.includes("api") ||
    q.includes("route") ||
    q.includes("endpoint") ||
    q.includes("http") ||
    q.includes("url") ||
    q.includes("controller")
  ) {
    return "api_routes";
  }
  if (
    q.includes("architecture") ||
    q.includes("structure") ||
    q.includes("design") ||
    q.includes("folder") ||
    q.includes("backend") ||
    q.includes("frontend")
  ) {
    return "architecture";
  }
  if (
    q.includes("health") ||
    q.includes("score") ||
    q.includes("risk") ||
    q.includes("issue") ||
    q.includes("finding") ||
    q.includes("vulnerability") ||
    q.includes("audit")
  ) {
    return "health";
  }
  if (
    q.includes("maintainability") ||
    q.includes("maintain") ||
    q.includes("complexity")
  ) {
    return "maintainability";
  }
  if (
    q.includes("test") ||
    q.includes("testing") ||
    q.includes("jest") ||
    q.includes("mocha") ||
    q.includes("vitest") ||
    q.includes("cypress") ||
    q.includes("playwright")
  ) {
    return "testing";
  }

  return "repository_overview";
}

/**
 * Retrieves the grounded graph context scoped to jobId and classified intent.
 */
export async function getGraphContext(jobId: string, question: string): Promise<StructuredContext> {
  const graphName = `devflow_${jobId.replace(/-/g, "_")}`;
  const repoId = `repository:${jobId}`;

  const intent = classifyQuestion(question);
  console.log(`[graph-context] Selected intent "${intent}" for question: "${question}"`);

  let graph;
  try {
    graph = await getGraphInstance(graphName);
  } catch (err: any) {
    console.error(`[graph-context] Failed to select graph "${graphName}":`, err);
    throw new Error("GRAPH_CONTEXT_UNAVAILABLE");
  }

  // Verify that the graph actually exists by running a quick health check or fetching the repo node
  let repoNode: any = null;
  try {
    const repoCheck: any = await graph.roQuery(
      `MATCH (r:Repository {id: $repoId}) RETURN r`,
      { params: { repoId } }
    );
    if (!repoCheck.data || repoCheck.data.length === 0) {
      console.warn(`[graph-context] Repository node not found for job ${jobId}`);
      throw new Error("GRAPH_CONTEXT_UNAVAILABLE");
    }
    repoNode = repoCheck.data[0].r?.properties || {};
  } catch (err: any) {
    console.error(`[graph-context] Graph read error for job ${jobId}:`, err);
    throw new Error("GRAPH_CONTEXT_UNAVAILABLE");
  }

  const repoOwner = repoNode.owner || "unknown";
  const repoName = repoNode.name || "unknown";

  const facts: GraphFact[] = [];
  let relsCount = 0;

  try {
    switch (intent) {
      case "frameworks": {
        const res = await graph.roQuery(
          `MATCH (r:Repository {id: $repoId})-[:USES_FRAMEWORK]->(f:Framework)
           RETURN f.name as name, f.confidence as confidence`,
          { params: { repoId } }
        );
        relsCount = res.data?.length || 0;
        (res.data || []).forEach((row: any) => {
          facts.push({
            type: "framework",
            name: row.name,
            confidence: row.confidence,
          });
        });
        break;
      }

      case "languages": {
        const res = await graph.roQuery(
          `MATCH (r:Repository {id: $repoId})-[:USES_LANGUAGE]->(l:Language)
           RETURN l.name as name, l.confidence as confidence`,
          { params: { repoId } }
        );
        relsCount = res.data?.length || 0;
        (res.data || []).forEach((row: any) => {
          facts.push({
            type: "language",
            name: row.name,
            confidence: row.confidence,
          });
        });
        break;
      }

      case "dependencies": {
        const res = await graph.roQuery(
          `MATCH (r:Repository {id: $repoId})-[:HAS_PACKAGE]->(p:Package)
           RETURN p.name as name, p.version as version, p.type as type`,
          { params: { repoId } }
        );
        relsCount = res.data?.length || 0;
        (res.data || []).forEach((row: any) => {
          facts.push({
            type: "package",
            name: row.name,
            version: row.version,
            packageType: row.type,
          });
        });
        break;
      }

      case "api_routes": {
        const res = await graph.roQuery(
          `MATCH (r:Repository {id: $repoId})-[:EXPOSES_ROUTE]->(route:ApiRoute)
           RETURN route.path as path, route.method as method, route.framework as framework, route.filePath as filePath, route.lineNumber as lineNumber`,
          { params: { repoId } }
        );
        relsCount = res.data?.length || 0;
        (res.data || []).forEach((row: any) => {
          facts.push({
            type: "api_route",
            path: row.path,
            method: row.method,
            framework: row.framework,
            filePath: row.filePath,
            lineNumber: row.lineNumber,
          });
        });
        break;
      }

      case "architecture": {
        const res = await graph.roQuery(
          `MATCH (r:Repository {id: $repoId})-[:HAS_ARCHITECTURE_SIGNAL]->(a:ArchitectureSignal)
           RETURN a.name as name, a.confidence as confidence`,
          { params: { repoId } }
        );
        relsCount = res.data?.length || 0;
        (res.data || []).forEach((row: any) => {
          facts.push({
            type: "architecture_signal",
            name: row.name,
            confidence: row.confidence,
          });
        });

        // Also fetch workspace components as they are central to architecture structure
        const workspacesRes = await graph.roQuery(
          `MATCH (r:Repository {id: $repoId})-[:CONTAINS_WORKSPACE]->(w:Workspace)
           RETURN w.name as name, w.path as path, w.type as type, w.language as language`,
          { params: { repoId } }
        );
        relsCount += workspacesRes.data?.length || 0;
        (workspacesRes.data || []).forEach((row: any) => {
          facts.push({
            type: "workspace",
            name: row.name,
            path: row.path,
            workspaceType: row.type,
            language: row.language,
          });
        });
        break;
      }

      case "health": {
        const res = await graph.roQuery(
          `MATCH (r:Repository {id: $repoId})-[:HAS_HEALTH_FINDING]->(h:HealthFinding)
           RETURN h.category as category, h.severity as severity, h.title as title, h.scoreImpact as scoreImpact`,
          { params: { repoId } }
        );
        relsCount = res.data?.length || 0;
        (res.data || []).forEach((row: any) => {
          facts.push({
            type: "health_finding",
            category: row.category,
            severity: row.severity,
            title: row.title,
            scoreImpact: row.scoreImpact,
          });
        });
        break;
      }

      case "workspace_structure": {
        const res = await graph.roQuery(
          `MATCH (r:Repository {id: $repoId})-[:CONTAINS_WORKSPACE]->(w:Workspace)
           RETURN w.name as name, w.path as path, w.type as type, w.language as language`,
          { params: { repoId } }
        );
        relsCount = res.data?.length || 0;
        (res.data || []).forEach((row: any) => {
          facts.push({
            type: "workspace",
            name: row.name,
            path: row.path,
            workspaceType: row.type,
            language: row.language,
          });
        });
        break;
      }

      case "package_usage": {
        const res = await graph.roQuery(
          `MATCH (w:Workspace)-[:HAS_PACKAGE]->(p:Package)
           RETURN w.name as workspaceName, w.path as workspacePath, p.name as packageName, p.version as version, p.type as type`,
          {}
        );
        relsCount = res.data?.length || 0;
        (res.data || []).forEach((row: any) => {
          facts.push({
            type: "package_usage",
            workspaceName: row.workspaceName,
            workspacePath: row.workspacePath,
            packageName: row.packageName,
            version: row.version,
            packageType: row.type,
          });
        });
        break;
      }

      case "testing": {
        // Signals matching 'test'
        const sigs = await graph.roQuery(
          `MATCH (r:Repository {id: $repoId})-[:HAS_ARCHITECTURE_SIGNAL]->(a:ArchitectureSignal)
           WHERE a.name CONTAINS 'test' OR a.name CONTAINS 'jest' OR a.name CONTAINS 'vitest'
           RETURN a.name as name, a.confidence as confidence`,
          { params: { repoId } }
        );
        relsCount += sigs.data?.length || 0;
        (sigs.data || []).forEach((row: any) => {
          facts.push({
            type: "architecture_signal",
            name: row.name,
            confidence: row.confidence,
          });
        });

        // Test Frameworks USES_TEST_FRAMEWORK
        const tfs = await graph.roQuery(
          `MATCH (r:Repository {id: $repoId})-[:USES_TEST_FRAMEWORK]->(tf:TestingFramework)
           RETURN tf.name as name`,
          { params: { repoId } }
        );
        relsCount += tfs.data?.length || 0;
        (tfs.data || []).forEach((row: any) => {
          facts.push({
            type: "testing_framework",
            name: row.name,
          });
        });
        break;
      }

      case "maintainability": {
        const res = await graph.roQuery(
          `MATCH (r:Repository {id: $repoId})-[:HAS_HEALTH_FINDING]->(h:HealthFinding)
           WHERE h.category = 'maintainability' OR h.title CONTAINS 'complex' OR h.title CONTAINS 'size'
           RETURN h.category as category, h.severity as severity, h.title as title, h.scoreImpact as scoreImpact`,
          { params: { repoId } }
        );
        relsCount = res.data?.length || 0;
        (res.data || []).forEach((row: any) => {
          facts.push({
            type: "health_finding",
            category: row.category,
            severity: row.severity,
            title: row.title,
            scoreImpact: row.scoreImpact,
          });
        });
        break;
      }

      default:
      case "repository_overview": {
        // High level overview fetches languages, frameworks, workspaces
        const langs = await graph.roQuery(
          `MATCH (r:Repository {id: $repoId})-[:USES_LANGUAGE]->(l:Language)
           RETURN l.name as name, l.confidence as confidence`,
          { params: { repoId } }
        );
        (langs.data || []).forEach((row: any) => {
          facts.push({
            type: "language",
            name: row.name,
            confidence: row.confidence,
          });
        });

        const fws = await graph.roQuery(
          `MATCH (r:Repository {id: $repoId})-[:USES_FRAMEWORK]->(f:Framework)
           RETURN f.name as name, f.confidence as confidence`,
          { params: { repoId } }
        );
        (fws.data || []).forEach((row: any) => {
          facts.push({
            type: "framework",
            name: row.name,
            confidence: row.confidence,
          });
        });

        const workspaces = await graph.roQuery(
          `MATCH (r:Repository {id: $repoId})-[:CONTAINS_WORKSPACE]->(w:Workspace)
           RETURN w.name as name, w.path as path, w.type as type`,
          { params: { repoId } }
        );
        (workspaces.data || []).forEach((row: any) => {
          facts.push({
            type: "workspace",
            name: row.name,
            path: row.path,
            workspaceType: row.type,
          });
        });

        relsCount = (langs.data?.length || 0) + (fws.data?.length || 0) + (workspaces.data?.length || 0);
        break;
      }
    }
  } catch (err: any) {
    console.error(`[graph-context] Query failed for intent ${intent} / job ${jobId}:`, err);
    throw new Error("GRAPH_CONTEXT_UNAVAILABLE");
  }

  // 4. Bound the facts array
  let contextTruncated = false;
  let finalFacts = [...facts];

  // Limit: maximum retrieved nodes/facts: 50
  if (finalFacts.length > 50) {
    finalFacts = finalFacts.slice(0, 50);
    contextTruncated = true;
  }

  // Limit: maximum context characters: 20,000 characters
  const baseJsonLength = JSON.stringify({
    repository: { owner: repoOwner, name: repoName },
    questionIntent: intent,
    facts: [],
    contextTruncated,
  }).length;

  let currentFactsLength = JSON.stringify(finalFacts).length;
  while (baseJsonLength + currentFactsLength > 20000 && finalFacts.length > 0) {
    finalFacts.pop();
    contextTruncated = true;
    currentFactsLength = JSON.stringify(finalFacts).length;
  }

  return {
    repository: {
      owner: repoOwner,
      name: repoName,
    },
    questionIntent: intent,
    facts: finalFacts,
    contextTruncated,
    metadata: {
      factsCount: finalFacts.length,
      relationshipsCount: Math.min(relsCount, 100), // Limit relationships representation count to max 100
      queryType: intent,
    },
  };
}
