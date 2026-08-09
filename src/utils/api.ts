export function getApiUrl(path: string): string {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
}
