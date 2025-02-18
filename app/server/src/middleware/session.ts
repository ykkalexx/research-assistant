import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../config/database';

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

    console.log('Existing sessionId from cookie:', sessionId);

    if (!sessionId) {
      sessionId = uuidv4();

      console.log('Creating new session with ID:', sessionId);

      const [existingSessions] = await db.execute(
        'SELECT id FROM sessions WHERE id = ?',
        [sessionId]
      );

      if (Array.isArray(existingSessions) && !existingSessions.length) {
        await db.execute(
          'INSERT INTO sessions (id, expires_at) VALUES (?, DATE_ADD(NOW(), INTERVAL 30 DAY))',
          [sessionId]
        );

        console.log('New session created in database');
      }

      // Set cookie that expires in 30 days
      res.cookie('sessionId', sessionId, {
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      });
    } else {
      // Verify existing session is valid
      const [sessions] = await db.execute(
        'SELECT id FROM sessions WHERE id = ? AND expires_at > NOW()',
        [sessionId]
      );

      if (!Array.isArray(sessions) || !sessions.length) {
        // Session expired or not found, create new one
        sessionId = uuidv4();

        // Debug log
        console.log(
          'Creating new session (old one invalid) with ID:',
          sessionId
        );

        await db.execute(
          'INSERT INTO sessions (id, expires_at) VALUES (?, DATE_ADD(NOW(), INTERVAL 30 DAY))',
          [sessionId]
        );

        res.cookie('sessionId', sessionId, {
          maxAge: 30 * 24 * 60 * 60 * 1000,
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
        });
      }
    }

    req.sessionId = sessionId;

    console.log('Final sessionId attached to request:', req.sessionId);

    next();
  } catch (error) {
    console.error('Session middleware error:', error);
    next(error);
  }
};
