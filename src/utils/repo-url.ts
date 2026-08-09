/**
 * Extracts repository owner and name from a GitHub URL.
 * Example: "https://github.com/FalkorDB/FalkorDB" -> { owner: "FalkorDB", name: "FalkorDB", display: "FalkorDB / FalkorDB" }
 */
export interface ParsedRepoUrl {
  owner: string;
  name: string;
  display: string;
  rawUrl: string;
}

export function parseRepoUrl(url: string | null | undefined): ParsedRepoUrl {
  if (!url || typeof url !== 'string') {
    return {
      owner: 'Repository',
      name: 'Analysis',
      display: 'Repository Analysis',
      rawUrl: '',
    };
  }

  try {
    const cleaned = url.trim().replace(/\/$/, '');
    const parts = cleaned.split('/');

    if (parts.length >= 2) {
      const name = parts[parts.length - 1];
      const owner = parts[parts.length - 2];
      if (owner && name) {
        return {
          owner,
          name,
          display: `${owner} / ${name}`,
          rawUrl: url,
        };
      }
    }
    return {
      owner: 'Repository',
      name: cleaned,
      display: cleaned,
      rawUrl: url,
    };
  } catch {
    return {
      owner: 'Repository',
      name: 'Analysis',
      display: url,
      rawUrl: url,
    };
  }
}
