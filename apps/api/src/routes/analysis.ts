import { Router, Request, Response } from 'express';
import {
  validateGithubRepositoryUrl,
  createAnalysisJob,
  getAnalysisJobById,
  getAnalysisResultByJobId,
} from '../services/analysis-service.js';

export const analysisRouter = Router();


/**
 * POST /api/analysis
 * Validates GitHub repository URL and creates a new analysis job row in Supabase.
 */
analysisRouter.post('/analysis', async (req: Request, res: Response) => {
  try {
    const { repositoryUrl } = req.body || {};
    const validatedUrl = validateGithubRepositoryUrl(repositoryUrl);

    if (!validatedUrl) {
      return res.status(400).json({
        ok: false,
        error: {
          code: 'INVALID_REPOSITORY_URL',
          message: 'A valid GitHub repository URL is required.',
        },
      });
    }

    const job = await createAnalysisJob(validatedUrl);

    return res.status(201).json({
      ok: true,
      data: {
        jobId: job.id,
        status: job.status,
      },
    });
  } catch (err: any) {
    console.error('Error in POST /api/analysis:', err);
    return res.status(500).json({
      ok: false,
      error: {
        code: 'ANALYSIS_JOB_CREATION_FAILED',
        message: 'Unable to create analysis job.',
      },
    });
  }
});

/**
 * GET /api/analysis/:jobId
 * Fetches current analysis job state by jobId.
 */
analysisRouter.get('/analysis/:jobId', async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;

    const job = await getAnalysisJobById(jobId);

    if (!job) {
      return res.status(404).json({
        ok: false,
        error: {
          code: 'ANALYSIS_JOB_NOT_FOUND',
          message: 'Analysis job not found.',
        },
      });
    }

    return res.status(200).json({
      ok: true,
      data: {
        jobId: job.id,
        repositoryUrl: job.repository_url,
        status: job.status,
        progress: job.progress,
        currentStage: job.current_stage,
        createdAt: job.created_at,
        startedAt: job.started_at,
        completedAt: job.completed_at,
      },
    });
  } catch (err: any) {
    console.error('Error in GET /api/analysis/:jobId:', err);
    return res.status(500).json({
      ok: false,
      error: {
        code: 'ANALYSIS_JOB_FETCH_FAILED',
        message: 'Unable to retrieve analysis job.',
      },
    });
  }
});

/**
 * GET /api/analysis/:jobId/result
 * Fetches computed repository intelligence result for a completed analysis job.
 */
analysisRouter.get('/analysis/:jobId/result', async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;

    const result = await getAnalysisResultByJobId(jobId);

    if (!result) {
      // Check if job exists to return a distinct error status if job exists but result is not ready
      const job = await getAnalysisJobById(jobId);

      if (!job) {
        return res.status(404).json({
          ok: false,
          error: {
            code: 'ANALYSIS_JOB_NOT_FOUND',
            message: 'Analysis job not found.',
          },
        });
      }

      return res.status(404).json({
        ok: false,
        error: {
          code: 'ANALYSIS_RESULT_NOT_FOUND',
          message:
            job.status === 'failed'
              ? 'Analysis job failed. No analysis result available.'
              : 'Analysis result is not ready yet.',
        },
      });
    }

    return res.status(200).json({
      ok: true,
      data: result,
    });
  } catch (err: any) {
    console.error('Error in GET /api/analysis/:jobId/result:', err);
    return res.status(500).json({
      ok: false,
      error: {
        code: 'ANALYSIS_RESULT_FETCH_FAILED',
        message: 'Unable to retrieve analysis result.',
      },
    });
  }
});

