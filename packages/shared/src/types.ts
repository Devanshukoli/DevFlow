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

export type AnalysisJobStatus = 'queued' | 'running' | 'completed' | 'failed';

export interface AnalysisJob {
  id: string;
  repositoryUrl: string;
  status: AnalysisJobStatus;
  progress: number;
  currentStage: string | null;
  errorMessage?: string | null;
  createdAt: string;
  startedAt?: string | null;
  completedAt?: string | null;
}

export interface CreateAnalysisJobRequest {
  repositoryUrl: string;
}

export interface CreateAnalysisJobSuccessResponse {
  ok: true;
  data: {
    jobId: string;
    status: AnalysisJobStatus;
  };
}

export interface GetAnalysisJobSuccessResponse {
  ok: true;
  data: {
    jobId: string;
    repositoryUrl: string;
    status: AnalysisJobStatus;
    progress: number;
    currentStage: string | null;
    createdAt: string;
    startedAt: string | null;
    completedAt: string | null;
  };
}

export interface ApiErrorDetail {
  code: string;
  message: string;
}

export interface ApiErrorResponse {
  ok: false;
  error: ApiErrorDetail;
}

export type CreateAnalysisJobResponse = CreateAnalysisJobSuccessResponse | ApiErrorResponse;
export type GetAnalysisJobResponse = GetAnalysisJobSuccessResponse | ApiErrorResponse;
