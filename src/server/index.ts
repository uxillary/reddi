import express from 'express';
import type { Request, Response } from 'express';
import { createServer } from '@devvit/web/server';
import { createPost } from './core/post.js';

const app = express();
app.use(express.json());

// Health probe (Devvit Web hits your bundled server code)
app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.post('/internal/menu/post-create', async (_req: Request, res: Response) => {
  try {
    const response = await createPost();
    res.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to create interactive post', error);
    res.json({
      showToast: {
        message: `Failed to create interactive post: ${message}`,
        type: 'error',
      },
    });
  }
});

const server = createServer((req, res) => app(req, res));

const port = Number(process.env.PORT ?? 3000);
server.listen(port, '0.0.0.0', () => {
  console.log(`[server] listening on port ${port}`);
});

export default server;
