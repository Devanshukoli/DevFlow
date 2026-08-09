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

export interface ArchitectureTreeNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: ArchitectureTreeNode[];
}

export interface ArchitectureDirectory {
  path: string;
  name: string;
  classification: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface ArchitectureSignal {
  name: string;
  description: string;
}

export interface ArchitectureEntryPoint {
  path: string;
  type: 'file' | 'script';
  description?: string;
}

export interface ArchitectureWorkspace {
  path: string;
  name: string;
  type: 'frontend' | 'backend' | 'library' | 'unknown';
  detectedLanguage?: string;
  detectedFramework?: string;
}

export interface RepositoryArchitecture {
  tree: ArchitectureTreeNode[];
  importantDirectories: ArchitectureDirectory[];
  entryPoints: ArchitectureEntryPoint[];
  signals: ArchitectureSignal[];
  workspaceBoundaries: ArchitectureWorkspace[];
  apiBoundaries: string[];
}

export interface ApiRoute {
  method: string;
  path: string | null;
  sourceFile: string;
  framework: string;
  confidence: 'high' | 'medium' | 'low';
  line?: number;
}

export interface ApiFramework {
  name: string;
  version?: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface GraphqlSurface {
  provider: string;
  endpoint: string | null;
  confidence: 'high' | 'medium' | 'low';
}

export interface RpcSurface {
  serviceName: string;
  methods: string[];
  sourceFile: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface ApiSurfaceSignal {
  signal: string;
  evidence: string[];
  confidence: 'high' | 'medium' | 'low';
}

export interface RepositoryApiSurface {
  frameworks: ApiFramework[];
  routes: ApiRoute[];
  graphql: GraphqlSurface[];
  rpc: RpcSurface[];
  signals: ApiSurfaceSignal[];
}

export type HealthSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export interface RiskFinding {
  id: string;
  category: string;
  severity: HealthSeverity;
  title: string;
  description: string;
  evidence: string[];
  confidence: 'high' | 'medium' | 'low';
  scoreImpact: number;
}

export interface HealthDimension {
  name: string;
  score: number;
  maxScore: number;
  description?: string;
}

export interface HealthSignal {
  name: string;
  evidence: string[];
}

export interface EngineeringHealthMetrics {
  testFileCount: number;
  testDirectoryCount: number;
  detectedTestingFrameworks: string[];
  largeSourceFilesCount: number;
  hasEnvFiles: boolean;
  hasPrivateKeys: boolean;
  [key: string]: any;
}

export interface EngineeringHealth {
  score: number;
  dimensions: HealthDimension[];
  findings: RiskFinding[];
  positiveSignals: HealthSignal[];
  metrics: EngineeringHealthMetrics;
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
  architecture: RepositoryArchitecture;
  apiSurface: RepositoryApiSurface;
  engineeringHealth: EngineeringHealth;
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
