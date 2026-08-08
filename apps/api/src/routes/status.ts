import { Router, Request, Response } from 'express';
import { getSupabaseConfigStatus } from '../../../../packages/shared/src/supabase';

export const statusRouter = Router();

statusRouter.get('/status', (req: Request, res: Response) => {
  const supabaseStatus = getSupabaseConfigStatus();

  res.json({
    ok: true,
    monorepo: {
      name: 'DevFlow Monorepo',
      packages: ['@devflow/web', '@devflow/api', '@devflow/shared'],
      version: '1.0.0'
    },
    backend: {
      status: 'active',
      nodeVersion: process.version,
      platform: process.platform
    },
    supabase: supabaseStatus,
    timestamp: new Date().toISOString()
  });
});
