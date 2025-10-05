import { Context, Next } from 'hono';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';

export interface AuthPayload {
  userId: number;
  email: string;
  warungNama: string;
}

export async function authMiddleware(c: Context, next: Next) {
  try {
    const authHeader = c.req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'No token provided' }, 401);
    }

    const token = authHeader.substring(7);

    const decoded = jwt.verify(token, JWT_SECRET) as AuthPayload;

    // Attach user info to context
    c.set('userId', decoded.userId);
    c.set('email', decoded.email);
    c.set('warungNama', decoded.warungNama);

    await next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return c.json({ error: 'Invalid or expired token' }, 401);
  }
}
