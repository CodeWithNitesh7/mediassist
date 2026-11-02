
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

// Render proxy configuration
app.set('trust proxy', 1);

app.use(helmet());

// Allow frontend origins
const allowedOrigins = [
  'https://mediassist-r3if.vercel.app',
  'http://localhost:5173',
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

app.use(express.json({ limit: '8mb' }));
app.use(cookieParser());

// Rate limiting
app.use(
  '/api/auth',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
  })
);

app.use(
  '/api/chat',
  rateLimit({
    windowMs: 60 * 1000,
    max: 30,
  })
);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/knowledge', knowledgeRoutes);
app.use('/api/admin', adminRoutes);

// Error handler
app.use((err, _req, res, _next) => {
  console.error(err);

  res.status(500).json({
    message: 'Something went wrong on the server.',
  });
});

const PORT = process.env.PORT || 5000;

async function start() {
  await mongoose.connect(
    process.env.MONGO_URI || 'mongodb://localhost:27017/healthchat'
  );

  console.log('MongoDB connected');

  await seedDefaults();

  app.listen(PORT, () => {
    console.log(`API running on port ${PORT}`);
  });
}

start().catch((e) => {
  console.error('Failed to start', e);
  process.exit(1);
});
