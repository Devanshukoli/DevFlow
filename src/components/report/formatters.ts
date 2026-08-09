/**
 * Formats byte values into human-readable units (B, KB, MB, GB).
 */
export function formatBytes(bytes: number): string {
  if (bytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const num = bytes / Math.pow(k, i);
  return `${parseFloat(num.toFixed(2))} ${sizes[i]}`;
}

/**
 * Validates if a string is a safe HTTPS GitHub repository URL.
 */
export function isValidGitHubUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && parsed.hostname === 'github.com';
  } catch {
    return false;
  }
}
