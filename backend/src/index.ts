import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRouter from './routes/auth';
import tasksRouter from './routes/tasks';
import pointsRouter from './routes/points';
import recapRouter from './routes/recap';
import announcementsRouter from './routes/announcements';
import delegatedRouter from './routes/delegated';
import notificationsRouter from './routes/notifications';
import feedbackRouter from './routes/feedback';
import timersRouter from './routes/timers';
import scheduleRouter from './routes/schedule';
import meetingsRouter from './routes/meetings';
import { startScheduler } from './scheduler';

const app = express();

const allowedOrigin = process.env.CORS_ORIGIN ?? 'http://localhost:5173';

app.use(cors({
  origin: allowedOrigin,
  credentials: true,
}));

app.use(express.json({ limit: '20mb' })); // allow base64 avatars + screenshots
app.use(cookieParser());

app.use('/auth', authRouter);
app.use('/tasks', tasksRouter);
app.use('/points', pointsRouter);
app.use('/recap', recapRouter);
app.use('/announcements', announcementsRouter);
app.use('/delegated', delegatedRouter);
app.use('/notifications', notificationsRouter);
app.use('/feedback', feedbackRouter);
app.use('/timers', timersRouter);
app.use('/schedule', scheduleRouter);
app.use('/meetings', meetingsRouter);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

export default app;

if (require.main === module) {
  const PORT = Number(process.env.PORT ?? 3000);
  startScheduler();
  app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
}
