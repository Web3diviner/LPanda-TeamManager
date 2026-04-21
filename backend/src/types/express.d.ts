import 'express';

export interface JwtUserPayload {
  sub: string;   // user id
  role: 'admin' | 'member' | 'ambassador' | 'ambassador_admin';
  name: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtUserPayload;
    }
  }
}
