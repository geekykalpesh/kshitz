import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import worksRoutes from './routes/works.js';
import settingsRoutes from './routes/settings.js';
import { db } from './db/index.js';
import { works } from './db/schema.js';
import { sql } from 'drizzle-orm';

const app = express();
const PORT = process.env.PORT || 3001;

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  process.env.FRONTEND_URL,
].filter(Boolean) as string[];

app.use(cors({
  origin: (origin, callback) => {
    // allow requests with no origin (like mobile apps, curl, or server-to-server)
    if (!origin) return callback(null, true);
    if (
      allowedOrigins.includes(origin) ||
      origin.endsWith('.vercel.app') ||
      process.env.NODE_ENV !== 'production'
    ) {
      return callback(null, true);
    }
    // Allow any origin for public API portfolio requests
    return callback(null, true);
  },
  credentials: true,
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.get('/', (_req, res) => {
  res.json({
    message: 'Kshitz Portfolio API is running',
    status: 'online',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      works: '/api/works',
      neonStatus: '/api/neon-status',
    },
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/works', worksRoutes);
app.use('/api/settings', settingsRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Neon services status endpoint to verify end-to-end integration
app.get('/api/neon-status', async (_req, res) => {
  const status: Record<string, any> = {
    timestamp: new Date().toISOString(),
    services: {},
  };

  // 1. Check Neon Lakebase Postgres
  try {
    const result = await db.execute(sql`SELECT count(*)::int as count FROM works`);
    status.services.postgres = {
      status: 'connected',
      database: 'Neon Lakebase Postgres',
      totalWorks: (result.rows[0] as any)?.count ?? 0,
    };
  } catch (err: any) {
    status.services.postgres = {
      status: 'error',
      error: err.message,
    };
  }

  // 2. Check Neon Functions
  if (process.env.NEON_FUNCTION_HELLO_BASE_URL) {
    try {
      const resp = await fetch(process.env.NEON_FUNCTION_HELLO_BASE_URL);
      const text = await resp.text();
      status.services.functions = {
        status: resp.ok ? 'active' : 'error',
        url: process.env.NEON_FUNCTION_HELLO_BASE_URL,
        response: text.trim(),
      };
    } catch (err: any) {
      status.services.functions = {
        status: 'unreachable',
        error: err.message,
      };
    }
  }

  // 3. Check Neon Auth
  if (process.env.NEON_AUTH_JWKS_URL) {
    try {
      const resp = await fetch(process.env.NEON_AUTH_JWKS_URL);
      const data = await resp.json();
      status.services.auth = {
        status: resp.ok ? 'active' : 'error',
        baseUrl: process.env.NEON_AUTH_BASE_URL,
        jwksKeysCount: (data as any)?.keys?.length ?? 0,
      };
    } catch (err: any) {
      status.services.auth = {
        status: 'unreachable',
        error: err.message,
      };
    }
  }

  // 4. Check Neon Object Storage
  if (process.env.AWS_ENDPOINT_URL_S3) {
    status.services.objectStorage = {
      status: 'configured',
      endpoint: process.env.AWS_ENDPOINT_URL_S3,
      bucket: 'assets',
      region: process.env.AWS_REGION || 'us-east-2',
    };
  }

  res.json(status);
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend server running at http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});

export default app;
