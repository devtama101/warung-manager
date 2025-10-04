import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import 'dotenv/config';

const app = new Hono();

// Enable CORS
app.use('/*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization']
}));

// Health check
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Warung POS API'
  });
});

// Root endpoint
app.get('/', (c) => {
  return c.json({
    message: 'Warung POS API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth/*',
      sync: '/api/sync/*',
      data: '/api/data/*'
    }
  });
});

// Auth routes
app.post('/api/auth/register', async (c) => {
  return c.json({ message: 'Register endpoint - to be implemented' }, 501);
});

app.post('/api/auth/login', async (c) => {
  return c.json({ message: 'Login endpoint - to be implemented' }, 501);
});

// Sync routes
app.post('/api/sync/:table', async (c) => {
  const table = c.req.param('table');
  return c.json({
    message: `Sync endpoint for ${table} - to be implemented`,
    success: true,
    data: { serverId: Math.floor(Math.random() * 1000), synced: true }
  });
});

// Data routes
app.get('/api/data/latest', async (c) => {
  return c.json({
    message: 'Data pull endpoint - to be implemented',
    data: {
      pesanan: [],
      menu: [],
      inventory: [],
      dailyReports: []
    }
  });
});

app.get('/api/data/sync-status', async (c) => {
  return c.json({
    success: true,
    data: {
      lastSyncAt: new Date().toISOString(),
      pendingSyncs: 0,
      failedSyncs: 0
    }
  });
});

const port = parseInt(process.env.PORT || '3001');

console.log(`🚀 Server starting on port ${port}`);

serve({
  fetch: app.fetch,
  port
}, (info) => {
  console.log(`✅ Server is running on http://localhost:${info.port}`);
});
