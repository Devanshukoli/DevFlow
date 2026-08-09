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
  res.setHeader('Cache-Control', 'no-store');
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
  res.setHeader('Cache-Control', 'no-store');
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

/**
 * GET /api/analysis/:jobId/graph
 * Fetches the interactive visualization data (nodes and links) for a job's knowledge graph.
 */
analysisRouter.get('/analysis/:jobId/graph', async (req: Request, res: Response) => {
  res.setHeader('Cache-Control', 'no-store');
  try {
    const { jobId } = req.params;
    const { getGraphVisual } = await import('../services/graph-query-service.js');
    const graphData = await getGraphVisual(jobId);
    return res.status(200).json({
      ok: true,
      data: graphData,
    });
  } catch (err: any) {
    console.error('Error in GET /api/analysis/:jobId/graph:', err);
    return res.status(500).json({
      ok: false,
      error: {
        code: 'GRAPH_FETCH_FAILED',
        message: 'Unable to retrieve repository knowledge graph.',
      },
    });
  }
});

/**
 * GET /api/analysis/:jobId/graph/query
 * Executes a pre-defined safe read-only Cypher query template on the job's knowledge graph.
 */
analysisRouter.get('/analysis/:jobId/graph/query', async (req: Request, res: Response) => {
  res.setHeader('Cache-Control', 'no-store');
  try {
    const { jobId } = req.params;
    const { type } = req.query;

    if (!type || typeof type !== 'string') {
      return res.status(400).json({
        ok: false,
        error: {
          code: 'MISSING_QUERY_TYPE',
          message: 'Query parameter "type" is required.',
        },
      });
    }

    const { getPredefinedQueryResults } = await import('../services/graph-query-service.js');
    try {
      const results = await getPredefinedQueryResults(jobId, type);
      return res.status(200).json({
        ok: true,
        data: results,
      });
    } catch (innerErr: any) {
      return res.status(400).json({
        ok: false,
        error: {
          code: 'INVALID_QUERY_TYPE',
          message: innerErr.message || 'Unsupported query type.',
        },
      });
    }
  } catch (err: any) {
    console.error('Error in GET /api/analysis/:jobId/graph/query:', err);
    return res.status(500).json({
      ok: false,
      error: {
        code: 'GRAPH_QUERY_FAILED',
        message: 'Unable to execute safe predefined query.',
      },
    });
  }
});

/**
 * GET /api/stats
 * Aggregates overall FalkorDB graph statistics across the system.
 */
analysisRouter.get('/stats', async (req: Request, res: Response) => {
  res.setHeader('Cache-Control', 'no-store');
  try {
    const { getFalkorDBClient } = await import('../lib/falkordb.js');
    const client = await getFalkorDBClient();
    const activeGraphs = await client.list();

    let totalNodes = 0;
    let totalRelationships = 0;

    for (const graphName of activeGraphs) {
      try {
        const graph = client.selectGraph(graphName);
        const nodesReply = await graph.query<any>("MATCH (n) RETURN count(n) as count");
        totalNodes += Number(nodesReply.data?.[0]?.count ?? 0);

        const relsReply = await graph.query<any>("MATCH ()-[r]->() RETURN count(r) as count");
        totalRelationships += Number(relsReply.data?.[0]?.count ?? 0);
      } catch (err) {
        // ignore individual graph failures
      }
    }

    return res.status(200).json({
      ok: true,
      data: {
        activeGraphs: activeGraphs.length,
        graphNames: activeGraphs,
        totalNodes,
        totalRelationships,
      },
    });
  } catch (err: any) {
    console.error('Error in GET /api/stats:', err);
    return res.status(200).json({
      ok: true,
      data: {
        activeGraphs: 0,
        graphNames: [],
        totalNodes: 0,
        totalRelationships: 0,
        warning: 'FalkorDB is currently unavailable or unconfigured.',
      },
    });
  }
});

/**
 * POST /api/analysis/:jobId/ask
 * Grounded QA about the repository.
 */
analysisRouter.post('/analysis/:jobId/ask', async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    const { question } = req.body || {};

    // Validate jobId
    if (!jobId || typeof jobId !== 'string' || jobId.trim().length < 5) {
      return res.status(400).json({
        ok: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'A valid analysis jobId is required.',
        },
      });
    }

    // Validate question
    if (!question || typeof question !== 'string' || question.trim().length < 3) {
      return res.status(400).json({
        ok: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'A question of at least 3 characters is required.',
        },
      });
    }

    if (question.length > 500) {
      return res.status(400).json({
        ok: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Question exceeds maximum allowed length of 500 characters.',
        },
      });
    }

    // 1. Graph retrieval layer
    let context;
    try {
      const { getGraphContext } = await import('../services/graph-context-service.js');
      context = await getGraphContext(jobId, question);
    } catch (err: any) {
      console.error(`[ask-api] Graph retrieval failed for job ${jobId}:`, err);
      return res.status(503).json({
        ok: false,
        error: {
          code: 'GRAPH_CONTEXT_UNAVAILABLE',
          message: 'Repository graph context is currently unavailable.',
        },
      });
    }

    // 2. AI Provider instantiation & response generation
    try {
      const { GeminiAIProvider } = await import('../services/ai/llm-provider.js');
      const provider = new GeminiAIProvider();
      
      const aiResult = await provider.generateAnswer(context, question);
      
      return res.status(200).json({
        ok: true,
        data: {
          question,
          intent: context.questionIntent,
          answer: aiResult.answer,
          evidence: aiResult.evidence,
          confidence: aiResult.confidence,
          contextStats: {
            factsCount: context.metadata?.factsCount || 0,
            relationshipsCount: context.metadata?.relationshipsCount || 0,
            queryType: context.metadata?.queryType || context.questionIntent,
          }
        },
      });
    } catch (err: any) {
      console.error(`[ask-api] AI Generation failed for job ${jobId}:`, err);
      return res.status(503).json({
        ok: false,
        error: {
          code: 'AI_PROVIDER_UNAVAILABLE',
          message: 'DevFlow could not generate an answer right now.',
        },
      });
    }
  } catch (err: any) {
    console.error('Unexpected error in /api/analysis/:jobId/ask:', err);
    return res.status(500).json({
      ok: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected internal error occurred.',
      },
    });
  }
});


