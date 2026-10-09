import express from 'express';
import type { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import { HttpError } from './errors';
import { simulateDelay } from './middleware/delay.middleware';
import authRoutes from './routes/auth.routes';
import caseRoutes from './routes/case.routes';
import userRoutes from './routes/user.routes';

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api', simulateDelay);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api', authRoutes);
app.use('/api/records', caseRoutes);
app.use('/api/users', userRoutes);

// The one place where errors become replies. It must come after the routes.
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof HttpError) {
    res.status(err.status).json({ message: err.message });
    return;
  }
  console.error(err);
  res.status(500).json({ message: 'Something went wrong on the server.' });
});

export default app;