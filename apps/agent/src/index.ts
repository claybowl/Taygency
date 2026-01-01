import express from 'express';
import routes from './routes/process.js';

const app = express();
const PORT = process.env.PORT ?? 3000;

app.use(express.json());

app.use((req, res, next) => {
  const authHeader = req.headers.authorization;
  const expectedSecret = process.env.AGENT_SECRET;

  if (req.path === '/health') {
    return next();
  }

  if (!expectedSecret) {
    console.warn('[Auth] AGENT_SECRET not configured');
    return next();
  }

  if (!authHeader || authHeader !== `Bearer ${expectedSecret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  next();
});

app.use(routes);

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Server] Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Agent server running on port ${PORT}`);
});
