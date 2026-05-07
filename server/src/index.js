import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDb, all } from './db/database.js';
import cameraRoutes from './routes/cameras.js';
import recordingRoutes from './routes/recordings.js';
import { cleanupAll, startHlsStream } from './services/ffmpegService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

const PORT = Number(process.env.PORT || 4000);
const HOST = process.env.HOST || '0.0.0.0';



const storageRoot = path.resolve(__dirname, '..', '..', 'storage');

app.use(cors());
app.use(express.json());
app.use('/hls', express.static(path.join(storageRoot, 'hls')));
app.use('/recordings', express.static(path.join(storageRoot, 'recordings')));
app.use('/screenshots', express.static(path.join(storageRoot, 'screenshots')));


app.get('/api/health', (_, res) => res.json({ ok: true }));

app.use('/api/cameras', cameraRoutes(io));
app.use('/api/recordings', recordingRoutes);

io.on('connection', async (socket) => {
  socket.emit('cameras:update', await all('SELECT * FROM cameras ORDER BY id DESC'));
});

await initDb();
const saved = await all('SELECT * FROM cameras');
saved.forEach((cam) => {
  if (cam.is_streaming) startHlsStream(cam);
});

process.on('SIGINT', () => {
  cleanupAll();
  process.exit(0);
});


server.listen(PORT, HOST, () => console.log(`Server: http://${HOST}:${PORT}`));

server.listen(4000, () => console.log('Server: http://localhost:4000'));

