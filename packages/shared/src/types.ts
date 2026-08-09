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

export interface DetectedLanguage {
  name: string;
  confidence: 'high' | 'medium' | 'low';
  fileCount?: number;
}

export interface DetectedFramework {
  name: string;
  confidence: 'high' | 'medium' | 'low';
  category?: string;
}

export type DependencyType = 'production' | 'development' | 'optional' | 'peer' | 'unknown';

export interface RepositoryDependency {
  name: string;
  version: string;
  type: DependencyType;
  source: string;
}

export interface RepositoryIntelligence {
  fileCount: number;
  directoryCount: number;
  totalBytes: number;
  extensionCounts: Record<string, number>;
  detectedFiles: string[];
  detectedLanguages: DetectedLanguage[];
  detectedFrameworks: DetectedFramework[];
  detectedPackageManager: string | null;
  detectedAppType: string;
  apiSurfaceHints: string[];
  architectureHints: string[];
  summary: string;
  dependencies: RepositoryDependency[];
  dependencyCount: number;
  productionDependencyCount: number;
  developmentDependencyCount: number;
  optionalDependencyCount: number;
  peerDependencyCount: number;
  dependencyManifests: string[];
}

export interface AnalysisResult extends RepositoryIntelligence {
  id: string;
  jobId: string;
  repositoryUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface GetAnalysisResultSuccessResponse {
  ok: true;
  data: AnalysisResult;
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
export type GetAnalysisResultResponse = GetAnalysisResultSuccessResponse | ApiErrorResponse;
