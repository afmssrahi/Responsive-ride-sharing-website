import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';

// Routes
import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/user/user.routes';
import driverRoutes from './modules/driver/driver.routes';
import rideRoutes from './modules/ride/ride.routes';
import adminRoutes from './modules/admin/admin.routes';

const app = express();

// ── Core Middleware ───────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(morgan(env.NODE_ENV === 'development' ? 'dev' : 'combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Static Uploads ────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(process.cwd(), env.UPLOAD_DIR)));

// ── Health Check ──────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' });
});

// ── API Routes ────────────────────────────────────────────────────
const API = '/api/v1';
app.use(`${API}/auth`, authRoutes);
app.use(`${API}/users`, userRoutes);
app.use(`${API}/drivers`, driverRoutes);
app.use(`${API}/rides`, rideRoutes);
app.use(`${API}/admin`, adminRoutes);

// ── Rating Route (inline for simplicity) ─────────────────────────
import { Router } from 'express';
import { authenticate } from './middleware/auth';
import { AuthRequest } from './middleware/auth';
import prisma from './config/database';

const ratingRouter = Router();
ratingRouter.post('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { rideId, toUserId, rating, comment } = req.body;
    if (!rideId || !toUserId || !rating) {
      return res.status(400).json({ success: false, message: 'rideId, toUserId, and rating are required' });
    }
    const result = await prisma.rating.upsert({
      where: { rideId_fromUserId_toUserId: { rideId, fromUserId: req.user!.id, toUserId } },
      update: { rating, comment },
      create: { rideId, fromUserId: req.user!.id, toUserId, rating, comment },
    });
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});
app.use(`${API}/ratings`, ratingRouter);

// ── 404 Handler ───────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ── Global Error Handler ──────────────────────────────────────────
app.use(errorHandler);

export default app;
