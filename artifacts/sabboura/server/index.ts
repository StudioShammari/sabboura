import express from 'express';
import path from 'node:path';
import http from 'node:http';
import { lessonsRouter } from './routes/lessons';
import { systemRouter } from './routes/system';
import { shareRouter } from './routes/share';
import { packsRouter } from './routes/packs';
import { loadUploadedTopics } from './packs/build';
import { aiState, hasAnthropic, hasOpenAI, models } from './ai/clients';

const isProd = process.env.NODE_ENV === 'production';
const port = Number(process.env.PORT || 5000);
const root = path.resolve(import.meta.dirname, '..');

async function main() {
  await loadUploadedTopics().catch((e) => console.warn('[packs] boot load failed', e.message));
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '1mb' }));
  app.use('/api', packsRouter);
  app.use('/api', lessonsRouter);
  app.use('/api', systemRouter);
  app.use(shareRouter);
  app.use('/api', (_req, res) => void res.status(404).json({ error: 'not found' }));

  const server = http.createServer(app);

  if (isProd) {
    const dist = path.join(root, 'dist/public');
    app.use(express.static(dist, { maxAge: '1h', index: false }));
    app.use(express.static(path.join(root, 'public'), { maxAge: '1h', index: false }));
    app.get(/.*/, (req, res) => {
      if (req.path !== '/' && !String(req.headers.accept ?? '').includes('text/html')) return void res.status(404).end();
      res.sendFile(path.join(dist, 'index.html'));
    });
  } else {
    const { createServer } = await import('vite');
    const vite = await createServer({
      root, configFile: path.join(root, 'vite.config.ts'), appType: 'spa',
      server: { middlewareMode: true, hmr: { server } },
    });
    app.use(vite.middlewares);
  }

  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('[server] unhandled', err?.message ?? err);
    if (!res.headersSent) res.status(500).json({ error: 'server' });
  });

  server.listen(port, '0.0.0.0', () => {
    console.log(`[sabboura] listening on ${port} (${isProd ? 'prod' : 'dev'})`);
    console.log(`[sabboura] anthropic=${hasAnthropic()} openai=${hasOpenAI()} judge=${models.list('judge').join('|')} structured=${aiState.structured}`);
  });
}
main().catch((e) => { console.error(e); process.exit(1); });
