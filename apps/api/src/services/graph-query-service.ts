import { getGraphInstance } from '../lib/falkordb.js';

export interface GraphNodeVisual {
  id: string;
  label: string;
  type: string;
  properties: Record<string, any>;
}

export interface GraphEdgeVisual {
  id: string;
  source: string;
  target: string;
  type: string;
  properties: Record<string, any>;
}

export interface GraphVisualData {
  nodes: GraphNodeVisual[];
  links: GraphEdgeVisual[];
}

/**
 * Executes a read-only query on a graph with performance monitoring.
 * Logs a warning if execution exceeds 500ms.
 */
async function executeReadOnlyQuery<T>(graphName: string, cypher: string, params?: Record<string, any>): Promise<T[]> {
  const start = Date.now();
  try {
    const graph = await getGraphInstance(graphName);
    const result = await graph.roQuery<any>(cypher, params ? { params } : undefined);
    const duration = Date.now() - start;

    if (duration > 500) {
      console.warn(`[graph-query-service] WARNING: Cypher query on "${graphName}" took ${duration}ms (exceeded 500ms): "${cypher.slice(0, 100)}..."`);
    } else {
      console.log(`[graph-query-service] Cypher query on "${graphName}" took ${duration}ms`);
    }

    return result.data || [];
  } catch (err) {
    console.error(`[graph-query-service] Error executing Cypher on "${graphName}":`, err);
    throw err;
  }
}

/**
 * Retrieves the high-level Repository node and its properties from the graph.
 */
export async function getRepositoryNode(jobId: string): Promise<any | null> {
  const graphName = `devflow_${jobId.replace(/-/g, '_')}`;
  const repoId = `repository:${jobId}`;

  try {
    const results = await executeReadOnlyQuery<any>(
      graphName,
      `MATCH (r:Repository {id: $repoId}) RETURN r`,
      { repoId }
    );
    if (results.length === 0 || !results[0].r) return null;
    return results[0].r.properties || null;
  } catch {
    return null;
  }
}

/**
 * Retrieves the visualization graph data (nodes & edges) safely, up to a given limit.
 */
export async function getGraphVisual(jobId: string, limit = 150): Promise<GraphVisualData> {
  const graphName = `devflow_${jobId.replace(/-/g, '_')}`;

  const nodesMap = new Map<string, GraphNodeVisual>();
  const edgesMap = new Map<string, GraphEdgeVisual>();

  try {
    // 1. Fetch connected nodes and their relationships
    const connectedResults = await executeReadOnlyQuery<any>(
      graphName,
      `MATCH (n)-[r]->(m) RETURN n, r, m LIMIT $limit`,
      { limit }
    );

    for (const row of connectedResults) {
      const n = row.n;
      const r = row.r;
      const m = row.m;

      if (n) {
        const id = n.properties.id || n.id;
        const type = n.labels?.[0] || 'Unknown';
        nodesMap.set(id, {
          id,
          label: n.properties.name || n.properties.path || id,
          type,
          properties: n.properties || {},
        });
      }

      if (m) {
        const id = m.properties.id || m.id;
        const type = m.labels?.[0] || 'Unknown';
        nodesMap.set(id, {
          id,
          label: m.properties.name || m.properties.path || id,
          type,
          properties: m.properties || {},
        });
      }

      if (r && n && m) {
        const sourceId = n.properties.id || n.id;
        const targetId = m.properties.id || m.id;
        const edgeId = `${r.id || `${sourceId}-${targetId}-${r.relationshipType}`}`;
        edgesMap.set(edgeId, {
          id: edgeId,
          source: sourceId,
          target: targetId,
          type: r.relationshipType || 'RELATED',
          properties: r.properties || {},
        });
      }
    }

    // 2. Fetch disconnected nodes to ensure we represent standalone elements as well
    if (nodesMap.size < limit) {
      const remainingLimit = limit - nodesMap.size;
      const singleResults = await executeReadOnlyQuery<any>(
        graphName,
        `MATCH (n) RETURN n LIMIT $limit`,
        { limit: remainingLimit }
      );

      for (const row of singleResults) {
        const n = row.n;
        if (n) {
          const id = n.properties.id || n.id;
          if (!nodesMap.has(id)) {
            const type = n.labels?.[0] || 'Unknown';
            nodesMap.set(id, {
              id,
              label: n.properties.name || n.properties.path || id,
              type,
              properties: n.properties || {},
            });
          }
        }
      }
    }
  } catch (err) {
    console.error(`[graph-query-service] Visual extraction failed for job ${jobId}:`, err);
  }

  return {
    nodes: Array.from(nodesMap.values()),
    links: Array.from(edgesMap.values()),
  };
}

/**
 * Predefined safe queries mapping to user questions.
 */
export async function getPredefinedQueryResults(jobId: string, queryType: string): Promise<any> {
  const graphName = `devflow_${jobId.replace(/-/g, '_')}`;
  const repoId = `repository:${jobId}`;

  switch (queryType) {
    case 'languages':
      return executeReadOnlyQuery<any>(
        graphName,
        `MATCH (r:Repository {id: $repoId})-[:USES_LANGUAGE]->(l:Language)
         RETURN l.name as name, l.confidence as confidence
         ORDER BY confidence DESC`,
        { repoId }
      );

    case 'frameworks':
      return executeReadOnlyQuery<any>(
        graphName,
        `MATCH (r:Repository {id: $repoId})-[:USES_FRAMEWORK]->(f:Framework)
         RETURN f.name as name, f.confidence as confidence
         ORDER BY confidence DESC`,
        { repoId }
      );

    case 'workspaces':
      const workspaces = await executeReadOnlyQuery<any>(
        graphName,
        `MATCH (r:Repository {id: $repoId})-[:CONTAINS_WORKSPACE]->(w:Workspace)
         RETURN w`,
        { repoId }
      );
      return workspaces.map((row) => row.w.properties);

    case 'packages':
      const packages = await executeReadOnlyQuery<any>(
        graphName,
        `MATCH (r:Repository {id: $repoId})-[:HAS_PACKAGE]->(p:Package)
         RETURN p LIMIT 100`,
        { repoId }
      );
      return packages.map((row) => row.p.properties);

    case 'routes':
      const routes = await executeReadOnlyQuery<any>(
        graphName,
        `MATCH (r:Repository {id: $repoId})-[:EXPOSES_ROUTE]->(rt:ApiRoute)
         RETURN rt`,
        { repoId }
      );
      return routes.map((row) => row.rt.properties);

    case 'findings':
      const findings = await executeReadOnlyQuery<any>(
        graphName,
        `MATCH (r:Repository {id: $repoId})-[:HAS_HEALTH_FINDING]->(f:HealthFinding)
         RETURN f`,
        { repoId }
      );
      return findings.map((row) => row.f.properties);

    default:
      throw new Error(`Unsupported safe query type: ${queryType}`);
  }
}
