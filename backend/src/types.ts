import { Context } from 'hono';

declare module 'hono' {
  interface ContextVariableMap {
    userId: number;
    email: string;
    businessName: string;
    role: string;
    warungId: number;
    user: { id: number; email: string; role: string };
  }
}
