import { FalkorDB, Graph } from 'falkordb';

let clientInstance: FalkorDB | null = null;

/**
 * Retrieves the singleton FalkorDB client instance.
 * Reuses the existing connection if already established.
 */
export async function getFalkorDBClient(): Promise<FalkorDB> {
  if (clientInstance) {
    return clientInstance;
  }

  const url = process.env.FALKORDB_URL || 'falkor://localhost:6379';
  const username = process.env.FALKORDB_USERNAME;
  const password = process.env.FALKORDB_PASSWORD;

  const options: any = {
    url,
  };

  if (username) {
    options.username = username;
  }
  if (password) {
    options.password = password;
  }

  console.log(`[falkordb] Connecting to FalkorDB at ${url}...`);
  try {
    clientInstance = await FalkorDB.connect(options);
    console.log(`[falkordb] Connected to FalkorDB successfully.`);
    return clientInstance;
  } catch (err) {
    console.error(`[falkordb] Failed to connect to FalkorDB:`, err);
    clientInstance = null;
    throw err;
  }
}

/**
 * Closes the FalkorDB connection.
 */
export async function closeFalkorDB(): Promise<void> {
  if (clientInstance) {
    try {
      await clientInstance.close();
      console.log(`[falkordb] Connection closed.`);
    } catch (err) {
      console.error(`[falkordb] Error closing connection:`, err);
    } finally {
      clientInstance = null;
    }
  }
}

/**
 * Performs a health check on the FalkorDB instance.
 */
export async function checkFalkorDBHealth(): Promise<boolean> {
  try {
    const client = await getFalkorDBClient();
    await client.list();
    return true;
  } catch (err) {
    console.error('[falkordb] Health check failed:', err);
    return false;
  }
}

/**
 * Selects and returns a Graph instance.
 */
export async function getGraphInstance(graphName: string): Promise<Graph> {
  const client = await getFalkorDBClient();
  return client.selectGraph(graphName);
}

/**
 * Helper to run a Cypher query on a specific graph and return raw rows.
 */
export async function runCypherQuery<T>(graphName: string, cypher: string): Promise<T[]> {
  const graph = await getGraphInstance(graphName);
  const result = await graph.query<any>(cypher);
  return result.data || [];
}
