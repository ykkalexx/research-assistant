import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '@/config/database';

interface SessionRequest extends Request {
  sessionId?: string;
}

export const sessionMiddleware = async (
  req: SessionRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    let sessionId = req.cookies.sessionId;

    if (!sessionId) {
      // Create new session
      sessionId = uuidv4();
      const [result] = await db.execute(
        'INSERT INTO sessions (id, expires_at) VALUES (?, DATE_ADD(NOW(), INTERVAL 30 DAY))',
        [sessionId]
      );

      // Set cookie that expires in 30 days
      res.cookie('sessionId', sessionId, {
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax', // Changed from 'strict' to 'lax'
        path: '/', // Ensure cookie is available across all paths
      });
    }

    req.sessionId = sessionId;
    next();
  } catch (error) {
    console.error('Session middleware error:', error);
    next(error);
  }
};
