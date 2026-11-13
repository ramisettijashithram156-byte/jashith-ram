// backend/src/server.js
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import router from './routes/api.js';
import { CONFIG } from './config/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// CORS – allow only origin defined in env (or * for dev)
app.use(cors({ origin: CONFIG.CORS_ORIGIN, credentials: true }));

// JSON body parser (for non‑multipart endpoints)
app.use(express.json());

// Serve static files if needed (e.g., health check)
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Mount API routes under /api
app.use('/api', router);

// Global error handler (fallback)
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(CONFIG.PORT, () => {
  console.log(`AgriPulse AI backend listening on port ${CONFIG.PORT}`);
});
