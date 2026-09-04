import express from 'express';
import { apiRouter } from './api.js';
import { initDb } from './db.js';

const app = express();

app.use(express.json());

// Initialize database (with resilient instant fallback on cloud/Vercel)
initDb().catch((err: any) => {
  console.warn('[Vercel Serverless] DB init note:', err?.message);
});

// Health check endpoints
app.get(['/', '/api'], (req, res) => {
  res.json({ status: 'ok', service: 'Fi Smart EMI Serverless API', timestamp: new Date().toISOString() });
});

// Mount router on both /api and root to handle any rewrite path format
app.use('/api', apiRouter);
app.use(apiRouter);

export default app;
