import { randomBytes } from 'crypto';
import type { Request, Response, NextFunction } from 'express';

const CSRF_TOKEN_LENGTH = 32;
const CSRF_HEADER_NAME = 'x-csrf-token';
const CSRF_SESSION_KEY = 'csrfToken';

export function generateCsrfToken(): string {
  return randomBytes(CSRF_TOKEN_LENGTH).toString('hex');
}

export function csrfProtection(req: Request, res: Response, next: NextFunction) {
  const session = (req as any).session;
  
  if (!session) {
    return res.status(500).json({ message: 'Session not initialized' });
  }

  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
    if (!session[CSRF_SESSION_KEY]) {
      session[CSRF_SESSION_KEY] = generateCsrfToken();
    }
    return next();
  }

  const tokenFromHeader = req.headers[CSRF_HEADER_NAME] as string;
  const tokenFromSession = session[CSRF_SESSION_KEY];

  if (!tokenFromSession || !tokenFromHeader || tokenFromHeader !== tokenFromSession) {
    return res.status(403).json({ message: 'Invalid CSRF token' });
  }

  next();
}

export function getCsrfToken(req: Request): string | null {
  const session = (req as any).session;
  if (!session || !session[CSRF_SESSION_KEY]) {
    return null;
  }
  return session[CSRF_SESSION_KEY];
}
