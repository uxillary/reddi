import express from 'express';
const app = express();
app.use(express.json());

// Health probe (Devvit Web hits your bundled server code)
app.get('/api/health', (_req, res) => res.json({ ok: true }));

export default app;
