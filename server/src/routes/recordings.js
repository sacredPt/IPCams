import { Router } from 'express';
import { all, run } from '../db/database.js';
import fs from 'fs';

const router = Router();

router.get('/', async (_, res) => {
  const rows = await all('SELECT * FROM recordings ORDER BY id DESC');
  res.json(rows);
});

router.delete('/:id', async (req, res) => {
  const rows = await all('SELECT * FROM recordings WHERE id=?', [req.params.id]);
  if (rows[0] && fs.existsSync(rows[0].filepath)) fs.unlinkSync(rows[0].filepath);
  await run('DELETE FROM recordings WHERE id=?', [req.params.id]);
  res.json({ ok: true });
});

export default router;
