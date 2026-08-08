import { Router, Request, Response } from 'express';
import { SystemHealthStatus } from '../../../../packages/shared/src/types';

export const healthRouter = Router();

const startTime = Date.now();

healthRouter.get('/health', (req: Request, res: Response) => {
  const health: SystemHealthStatus = {
    service: 'backend',
    status: 'online',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor((Date.now() - startTime) / 1000),
    environment: process.env.NODE_ENV || 'development'
  };

  res.json({
    ok: true,
    data: health,
    message: 'Backend API service is operating normally'
  });
});
