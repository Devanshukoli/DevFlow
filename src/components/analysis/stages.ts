export interface StageInfo {
  id: string;
  name: string;
  description: string;
  progressMarker: number;
}

/**
 * Stages corresponding directly to the background analysis worker steps in `apps/api/src/worker.ts`.
 */
export const WORKER_STAGES: StageInfo[] = [
  {
    id: 'preparing',
    name: 'Preparing repository',
    description: 'Initializing secure sandbox filesystem directory for repository analysis.',
    progressMarker: 5,
  },
  {
    id: 'cloning',
    name: 'Cloning repository',
    description: 'Performing shallow Git clone (`git clone --depth 1`) from GitHub.',
    progressMarker: 20,
  },
  {
    id: 'cloned',
    name: 'Repository cloned',
    description: 'Repository files retrieved successfully. Preparing directory structure for inspection.',
    progressMarker: 35,
  },
  {
    id: 'inspecting',
    name: 'Inspecting repository',
    description: 'Walking directory tree, identifying file types, and filtering standard build artifacts.',
    progressMarker: 50,
  },
  {
    id: 'metadata',
    name: 'Collecting metadata',
    description: 'Calculating total byte size, file and directory counts, and extension distributions.',
    progressMarker: 65,
  },
  {
    id: 'intelligence',
    name: 'Deriving repository intelligence',
    description: 'Extracting language breakdown, framework configs, package manager markers, and architecture hints.',
    progressMarker: 80,
  },
  {
    id: 'persisting',
    name: 'Persisting analysis results',
    description: 'Saving computed repository intelligence dataset to DevFlow database.',
    progressMarker: 90,
  },
  {
    id: 'completed',
    name: 'Completed',
    description: 'Analysis lifecycle finished. Repository intelligence report is generated and ready.',
    progressMarker: 100,
  },
];

export type StageStatus = 'completed' | 'current' | 'pending' | 'failed';

export interface EvaluatedStage extends StageInfo {
  status: StageStatus;
}

/**
 * Computes status for each stage based on real job status, progress, and current stage.
 */
export function evaluateWorkerStages(
  jobStatus: 'queued' | 'running' | 'completed' | 'failed',
  progress: number,
  currentStage: string | null
): EvaluatedStage[] {
  if (jobStatus === 'completed') {
    return WORKER_STAGES.map((s) => ({ ...s, status: 'completed' }));
  }

  if (jobStatus === 'queued') {
    return WORKER_STAGES.map((s) => ({ ...s, status: 'pending' }));
  }

  const normalizedCurrent = (currentStage || '').toLowerCase().trim();

  // Find index of matching current stage in WORKER_STAGES
  let currentIndex = WORKER_STAGES.findIndex(
    (s) => s.name.toLowerCase().trim() === normalizedCurrent
  );

  // Fallback to progress marker matching if stage string was slightly different
  if (currentIndex === -1) {
    for (let i = WORKER_STAGES.length - 1; i >= 0; i--) {
      if (progress >= WORKER_STAGES[i].progressMarker) {
        currentIndex = i;
        break;
      }
    }
  }

  if (currentIndex === -1) currentIndex = 0;

  return WORKER_STAGES.map((stage, idx) => {
    if (jobStatus === 'failed') {
      if (idx < currentIndex) return { ...stage, status: 'completed' };
      if (idx === currentIndex) return { ...stage, status: 'failed' };
      return { ...stage, status: 'pending' };
    }

    if (idx < currentIndex) {
      return { ...stage, status: 'completed' };
    } else if (idx === currentIndex) {
      return { ...stage, status: 'current' };
    } else {
      return { ...stage, status: 'pending' };
    }
  });
}

export function getStageDescription(currentStage: string | null, status: string): string {
  if (status === 'queued') {
    return 'The analysis job is queued in DevFlow and waiting for an available analysis worker.';
  }
  if (status === 'completed') {
    return 'Repository analysis complete! All structural metrics and repository intelligence have been compiled.';
  }
  if (status === 'failed') {
    return 'Analysis processing halted due to an error encountered during worker execution.';
  }

  const stage = WORKER_STAGES.find(
    (s) => s.name.toLowerCase().trim() === (currentStage || '').toLowerCase().trim()
  );

  return stage ? stage.description : 'Processing repository files and compiling structural metrics...';
}
