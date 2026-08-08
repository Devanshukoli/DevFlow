export interface SystemHealthStatus {
  service: 'frontend' | 'backend' | 'shared';
  status: 'online' | 'degraded' | 'offline';
  timestamp: string;
  uptimeSeconds: number;
  environment: string;
}

export interface SupabaseConfigStatus {
  configured: boolean;
  urlProvided: boolean;
  keyProvided: boolean;
  message: string;
}
