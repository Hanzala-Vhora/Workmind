// server/src/server.ts
import express, { Express } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import intakeFormRoutes from './routes/intakeForms';
import workspaceRoutes from './routes/workspaces';
import agentRoutes from './routes/agents';
import threadRoutes from './routes/threads';

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
app.use('/api/intake-forms', intakeFormRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/threads', threadRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
