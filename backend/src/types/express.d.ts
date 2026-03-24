import 'express';

export interface JwtUserPayload {
  sub: string;   // user id
  role: 'admin' | 'member';
  name: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtUserPayload;
    }
  }
}
