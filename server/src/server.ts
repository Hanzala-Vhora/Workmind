// server/src/server.ts
import 'dotenv/config';
import express from 'express';
import path from 'path';
import type { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cluster from 'node:cluster';
import { cpus } from 'node:os';
import process from 'node:process';
import intakeFormRoutes from './routes/intakeForms.js';
import workspaceRoutes from './routes/workspaces.js';
import agentRoutes from './routes/agents.js';
import threadRoutes from './routes/threads.js';
import userRoutes from './routes/users.js';
import chatRoutes from './routes/chat.js';
import uploadRoutes from './routes/upload.js';
import settingsRoutes from './routes/settings.js';
import adminRoutes from './routes/admin.js';



import waitlistRoutes from './routes/waitlist.js';

const app: Express = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ extended: true, limit: '500mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/intake-forms', intakeFormRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/threads', threadRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/waitlist', waitlistRoutes);

// Serve static frontend files in production
if (process.env.NODE_ENV === 'production') {
  const __dirname = path.resolve();
  app.use(express.static(path.join(__dirname, '../dist')));

  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist', 'index.html'));
  });
}

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

const startServer = () => {
  app.listen(PORT, () => {
    console.log(`Worker ${process.pid} started server on http://localhost:${PORT}`);
  });
};

if (process.env.NODE_ENV === 'production' && cluster.isPrimary) {
  const numCPUs = Math.min(cpus().length, 2);
  console.log(`Primary ${process.pid} is running. Forking ${numCPUs} workers to save memory...`);

  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died. Respawning...`);
    cluster.fork();
  });
} else {
  startServer();
}

