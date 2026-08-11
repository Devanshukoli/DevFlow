import { Router, Request, Response } from 'express';
import {
  registerUser,
  loginUser,
  getUserBySessionToken,
  invalidateSessionToken,
  getUserAnalyses,
} from '../services/user-service.js';

export const authRouter = Router();

export function getSessionTokenFromRequest(req: Request): string {
  // 1. Try reading HTTP cookie
  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    const cookies = Object.fromEntries(
      cookieHeader.split(';').map((c) => {
        const [k, ...v] = c.trim().split('=');
        return [k, decodeURIComponent(v.join('='))];
      })
    );
    if (cookies.devflow_session) {
      return cookies.devflow_session;
    }
  }

  // 2. Try Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }

  return '';
}

// GET /api/users/me/analyses
authRouter.get('/users/me/analyses', async (req: Request, res: Response) => {
  const sessionToken = getSessionTokenFromRequest(req);
  if (!sessionToken) {
    res.status(401).json({ ok: false, error: { code: 'unauthorized', message: 'Not authenticated' } });
    return;
  }

  const user = await getUserBySessionToken(sessionToken);
  if (!user) {
    res.status(401).json({ ok: false, error: { code: 'unauthorized', message: 'Session expired or invalid' } });
    return;
  }

  const analyses = getUserAnalyses(user.id);
  res.json({
    ok: true,
    data: analyses,
  });
});

// POST /api/auth/signup
authRouter.post('/auth/signup', async (req: Request, res: Response) => {
  try {
    const { email, password, confirmPassword } = req.body || {};

    if (!email || typeof email !== 'string') {
      res.status(400).json({ ok: false, error: { code: 'INVALID_EMAIL', message: 'Email address is required.' } });
      return;
    }

    if (!password || typeof password !== 'string' || password.length < 8) {
      res.status(400).json({ ok: false, error: { code: 'PASSWORD_TOO_SHORT', message: 'Password must be at least 8 characters long.' } });
      return;
    }

    if (confirmPassword !== undefined && password !== confirmPassword) {
      res.status(400).json({ ok: false, error: { code: 'PASSWORDS_DO_NOT_MATCH', message: 'Passwords do not match.' } });
      return;
    }

    const { user, sessionToken } = await registerUser(email, password);

    // Persist session via HTTP-only Supabase/DevFlow cookie
    res.cookie('devflow_session', sessionToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(201).json({
      ok: true,
      data: {
        user,
        sessionToken,
      },
    });
  } catch (err: any) {
    if (err && err.code === 'email_already_registered') {
      res.status(400).json({
        ok: false,
        error: {
          code: 'email_already_registered',
          message: 'Email is already registered',
        },
      });
      return;
    }

    res.status(400).json({
      ok: false,
      error: {
        code: err?.code || 'SIGNUP_FAILED',
        message: err?.message || 'Failed to create account.',
      },
    });
  }
});

// POST /api/auth/signin
authRouter.post('/auth/signin', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      res.status(400).json({
        ok: false,
        error: {
          code: 'invalid_credentials',
          message: 'Invalid email or password',
        },
      });
      return;
    }

    const { user, sessionToken } = await loginUser(email, password);

    // Persist session via cookie
    res.cookie('devflow_session', sessionToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      ok: true,
      data: {
        user,
        sessionToken,
      },
    });
  } catch (err: any) {
    // Basic security: Don't leak whether email vs password was wrong
    res.status(401).json({
      ok: false,
      error: {
        code: 'invalid_credentials',
        message: 'Invalid email or password',
      },
    });
  }
});

// POST /api/auth/signout
authRouter.post('/auth/signout', async (req: Request, res: Response) => {
  const sessionToken = getSessionTokenFromRequest(req);
  if (sessionToken) {
    invalidateSessionToken(sessionToken);
  }

  res.clearCookie('devflow_session');
  res.json({ ok: true });
});

// GET /api/auth/me
authRouter.get('/auth/me', async (req: Request, res: Response) => {
  const sessionToken = getSessionTokenFromRequest(req);
  if (!sessionToken) {
    res.status(401).json({ ok: false, error: { code: 'unauthorized', message: 'Not authenticated' } });
    return;
  }

  const user = await getUserBySessionToken(sessionToken);
  if (!user) {
    res.clearCookie('devflow_session');
    res.status(401).json({ ok: false, error: { code: 'unauthorized', message: 'Session expired or invalid' } });
    return;
  }

  res.json({
    ok: true,
    data: {
      user,
      sessionToken,
    },
  });
});
