import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/auth.js';
import chatRoutes from './routes/chat.js';
import knowledgeRoutes from './routes/knowledge.js';
import adminRoutes from './routes/admin.js';
import { seedDefaults } from './seed.js';

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
    credentials: true, // required so the browser sends the auth cookie
  })
);
app.use(express.json({ limit: '8mb' }));
app.use(cookieParser());

// Basic brute-force protection on auth + chat endpoints
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));
app.use('/api/chat', rateLimit({ windowMs: 60 * 1000, max: 30 }));

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/knowledge', knowledgeRoutes);
app.use('/api/admin', adminRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: 'Something went wrong on the server.' });
});

const PORT = process.env.PORT || 5000;

async function start() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/healthchat');
  console.log('MongoDB connected');
  await seedDefaults();
  app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
}

start().catch((e) => {
  console.error('Failed to start', e);
  process.exit(1);
});
