import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import type { JwtUserPayload } from '../types/express';

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-in-production';

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const token: string | undefined = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : req.cookies?.token; // fallback for local dev

  if (!token) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as JwtUserPayload;
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (req.user?.role !== 'admin') {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }
  next();
}

export function requireAmbassadorAdmin(req: Request, res: Response, next: NextFunction): void {
  if (req.user?.role !== 'ambassador_admin' && req.user?.role !== 'admin') {
    res.status(403).json({ error: 'Ambassador admin access required' });
    return;
  }
  next();
}
