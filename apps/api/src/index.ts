import { Router } from 'express';
import { healthRouter } from './routes/health.js';
import { statusRouter } from './routes/status.js';
import { analysisRouter } from './routes/analysis.js';

export const apiRouter = Router();

apiRouter.use(healthRouter);
apiRouter.use(statusRouter);
apiRouter.use(analysisRouter);

export function configureApiRoutes(app: Router) {
  app.use('/api', apiRouter);
}


