// server/src/server.ts
import express from 'express';
import path from 'path';
import type { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import intakeFormRoutes from './routes/intakeForms.ts';
import workspaceRoutes from './routes/workspaces.ts';
import agentRoutes from './routes/agents.ts';
import threadRoutes from './routes/threads.ts';
import userRoutes from './routes/users.ts';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
// Routes
app.use('/api/intake-forms', intakeFormRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/threads', threadRoutes);
app.use('/api/users', userRoutes);

// Serve static frontend files in production
if (process.env.NODE_ENV === 'production') {
  const __dirname = path.resolve();
  // Assuming the build runs from root, and backend starts from server/, we need to find the dist folder correctly.
  // If we run `node server/dist/server.js` from root:
  app.use(express.static(path.join(__dirname, '../dist')));

  // Handle client-side routing
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist', 'index.html'));
  });
}

// 404 handler (only if not handled by static files)
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
