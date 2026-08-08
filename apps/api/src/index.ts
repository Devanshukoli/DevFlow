import { Router } from 'express';
import { healthRouter } from './routes/health.js';
import { statusRouter } from './routes/status.js';
import { aiRouter } from './routes/ai.js';

export const apiRouter = Router();

apiRouter.use(healthRouter);
apiRouter.use(statusRouter);
apiRouter.use(aiRouter);

export function configureApiRoutes(app: Router) {
  app.use('/api', apiRouter);
}

