import { Router } from 'express';
import { all, get, run } from '../db/database.js';
import {
  getHlsPublicPath,
  startHlsStream,
  stopHlsStream,
  takeScreenshot,
  startRecording,
  stopRecording
} from '../services/ffmpegService.js';
import { ptzMove, testOnvifConnection } from '../services/onvifService.js';

export default function cameraRoutes(io) {
  const router = Router();

  const emitUpdate = async () => io.emit('cameras:update', await all('SELECT * FROM cameras ORDER BY id DESC'));

  router.get('/', async (_, res) => res.json(await all('SELECT * FROM cameras ORDER BY id DESC')));

  router.post('/', async (req, res) => {
    const { name, ip, username, password, rtsp_url } = req.body;
    const result = await run(
      'INSERT INTO cameras (name,ip,username,password,rtsp_url) VALUES (?,?,?,?,?)',
      [name, ip, username || '', password || '', rtsp_url]
    );
    await emitUpdate();
    res.status(201).json(await get('SELECT * FROM cameras WHERE id=?', [result.id]));
  });

  router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { name, ip, username, password, rtsp_url } = req.body;
    await run(
      'UPDATE cameras SET name=?, ip=?, username=?, password=?, rtsp_url=?, updated_at=CURRENT_TIMESTAMP WHERE id=?',
      [name, ip, username || '', password || '', rtsp_url, id]
    );
    await emitUpdate();
    res.json(await get('SELECT * FROM cameras WHERE id=?', [id]));
  });

  router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    stopHlsStream(Number(id));
    await run('DELETE FROM cameras WHERE id=?', [id]);
    await emitUpdate();
    res.json({ ok: true });
  });

  router.post('/:id/test', async (req, res) => {
    const camera = await get('SELECT * FROM cameras WHERE id=?', [req.params.id]);
    try {
      await testOnvifConnection(camera);
      res.json({ ok: true });
    } catch (e) {
      res.status(400).json({ ok: false, error: e.message });
    }
  });

  router.post('/:id/start', async (req, res) => {
    const camera = await get('SELECT * FROM cameras WHERE id=?', [req.params.id]);
    startHlsStream(camera);
    await run('UPDATE cameras SET is_streaming=1 WHERE id=?', [camera.id]);
    await emitUpdate();
    res.json({ ok: true, hls: getHlsPublicPath(camera.id) });
  });

  router.post('/:id/stop', async (req, res) => {
    const id = Number(req.params.id);
    stopHlsStream(id);
    await run('UPDATE cameras SET is_streaming=0 WHERE id=?', [id]);
    await emitUpdate();
    res.json({ ok: true });
  });

  router.post('/:id/screenshot', async (req, res) => {
    const camera = await get('SELECT * FROM cameras WHERE id=?', [req.params.id]);
    takeScreenshot(camera, (err, data) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ ok: true, ...data, downloadUrl: `/screenshots/${data.filename}` });
    });
  });

  router.post('/:id/record/start', async (req, res) => {
    const camera = await get('SELECT * FROM cameras WHERE id=?', [req.params.id]);
    const started = startRecording(camera);
    if (!started) return res.status(400).json({ error: 'Already recording' });
    const result = await run(
      'INSERT INTO recordings (camera_id,filename,filepath,started_at) VALUES (?,?,?,?)',
      [camera.id, started.filename, started.filepath, started.startedAt]
    );
    await run('UPDATE cameras SET is_recording=1 WHERE id=?', [camera.id]);
    await emitUpdate();
    res.json({ ok: true, recording_id: result.id });
  });

  router.post('/:id/record/stop', async (req, res) => {
    const cameraId = Number(req.params.id);
    const rec = stopRecording(cameraId);
    if (!rec) return res.status(400).json({ error: 'Not recording' });
    await run(
      'UPDATE recordings SET ended_at=? WHERE camera_id=? AND filename=? AND ended_at IS NULL',
      [new Date().toISOString(), cameraId, rec.filename]
    );
    await run('UPDATE cameras SET is_recording=0 WHERE id=?', [cameraId]);
    await emitUpdate();
    res.json({ ok: true });
  });

  router.post('/:id/ptz', async (req, res) => {
    const camera = await get('SELECT * FROM cameras WHERE id=?', [req.params.id]);
    try {
      const out = await ptzMove(camera, req.body);
      res.json(out);
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  });

  return router;
}
