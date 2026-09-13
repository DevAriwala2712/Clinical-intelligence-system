// server.ts
//
// WHAT: the file you actually run (`npm run dev` or `npm start`). It:
//   1. Creates the Express "app" object.
//   2. Attaches global middleware (JSON body parsing, CORS for the web dashboard).
//   3. Mounts our route map from routes/index.ts under /api.
//   4. Starts listening on the configured port.

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import routes from './routes';

dotenv.config();

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',') })); // allow the Flutter Web dashboard's origin
app.use(express.json()); // parses incoming JSON request bodies into req.body

app.use('/api', routes);

// Basic health check so you can confirm the server is up: GET /health
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// Catch-all error handler: only catches errors passed to next(err) by
// synchronous middleware, or from an async handler wrapped so its rejection
// reaches next(). Express 4 does NOT route an unhandled rejection from a
// plain `async function` route handler here on its own - such a rejection
// is unhandled and crashes the whole process. None of the controllers in
// this codebase are wrapped, so in practice this handler is currently
// unreachable from controller code; treat it as defense for
// synchronous/middleware errors only, not a safety net for async ones.
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Rehab backend listening on http://localhost:${port}`);
});
