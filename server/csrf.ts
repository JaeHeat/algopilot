import { randomBytes } from 'crypto';
import type { Request, Response, NextFunction } from 'express';

const CSRF_TOKEN_LENGTH = 32;
const CSRF_HEADER_NAME = 'x-csrf-token';
const CSRF_COOKIE_NAME = 'csrf_token';

export function generateCsrfToken(): string {
  return randomBytes(CSRF_TOKEN_LENGTH).toString('hex');
}

export function csrfProtection(req: Request, res: Response, next: NextFunction) {
  // Skip CSRF for TradingView webhooks - they use their own auth (secret + token)
  if (req.path.startsWith('/webhooks/')) {
    return next();
  }
  
  // Also skip for the full /api/webhooks path (when applied via app.use('/api', csrfProtection))
  if (req.originalUrl.includes('/api/webhooks/')) {
    return next();
  }
  
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
    let tokenFromCookie = req.cookies?.[CSRF_COOKIE_NAME];
    
    if (!tokenFromCookie) {
      tokenFromCookie = generateCsrfToken();
      res.cookie(CSRF_COOKIE_NAME, tokenFromCookie, {
        httpOnly: false,
        secure: true,
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
    }
    
    return next();
  }

  const tokenFromHeader = req.headers[CSRF_HEADER_NAME] as string;
  const tokenFromCookie = req.cookies?.[CSRF_COOKIE_NAME];

  if (!tokenFromCookie || !tokenFromHeader || tokenFromHeader !== tokenFromCookie) {
    return res.status(403).json({ message: 'Invalid CSRF token' });
  }

  next();
}

export function getCsrfToken(req: Request): string | null {
  return req.cookies?.[CSRF_COOKIE_NAME] || null;
}
