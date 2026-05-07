import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import fs from 'fs';
import path from 'path';

ffmpeg.setFfmpegPath(ffmpegPath);

const rootStorage = path.resolve(process.cwd(), '..', 'storage');
const hlsRoot = path.join(rootStorage, 'hls');
const recordingsRoot = path.join(rootStorage, 'recordings');
const screenshotsRoot = path.join(rootStorage, 'screenshots');

[hlsRoot, recordingsRoot, screenshotsRoot].forEach((p) => fs.mkdirSync(p, { recursive: true }));

const streamProcs = new Map();
const recordProcs = new Map();

export function getHlsPublicPath(cameraId) {
  return `/hls/camera_${cameraId}/index.m3u8`;
}

export function startHlsStream(camera) {
  if (streamProcs.has(camera.id)) return;
  const dir = path.join(hlsRoot, `camera_${camera.id}`);
  fs.mkdirSync(dir, { recursive: true });
  const output = path.join(dir, 'index.m3u8');

  const command = ffmpeg(camera.rtsp_url)
    .inputOptions(['-rtsp_transport tcp', '-stimeout 5000000'])
    .outputOptions([
      '-c:v copy',
      '-c:a aac',
      '-f hls',
      '-hls_time 2',
      '-hls_list_size 6',
      '-hls_flags delete_segments+append_list'
    ])
    .output(output)
    .on('start', (cmd) => console.log(`HLS start ${camera.id}:`, cmd))
    .on('error', (err) => {
      console.error(`HLS error camera ${camera.id}:`, err.message);
      streamProcs.delete(camera.id);
      setTimeout(() => startHlsStream(camera), 4000);
    })
    .on('end', () => {
      streamProcs.delete(camera.id);
      setTimeout(() => startHlsStream(camera), 4000);
    });

  command.run();
  streamProcs.set(camera.id, command);
}

export function stopHlsStream(cameraId) {
  const proc = streamProcs.get(cameraId);
  if (proc) {
    proc.kill('SIGKILL');
    streamProcs.delete(cameraId);
  }
}

export function takeScreenshot(camera, cb) {
  const filename = `camera_${camera.id}_${Date.now()}.jpg`;
  const filepath = path.join(screenshotsRoot, filename);
  ffmpeg(camera.rtsp_url)
    .inputOptions(['-rtsp_transport tcp'])
    .frames(1)
    .output(filepath)
    .on('end', () => cb(null, { filename, filepath }))
    .on('error', (err) => cb(err))
    .run();
}

export function startRecording(camera) {
  if (recordProcs.has(camera.id)) return null;
  const filename = `camera_${camera.id}_${Date.now()}.mp4`;
  const filepath = path.join(recordingsRoot, filename);

  const command = ffmpeg(camera.rtsp_url)
    .inputOptions(['-rtsp_transport tcp'])
    .outputOptions(['-c copy', '-movflags +faststart'])
    .output(filepath)
    .on('error', (err) => {
      console.error(`Recording error camera ${camera.id}:`, err.message);
      recordProcs.delete(camera.id);
    })
    .on('end', () => {
      recordProcs.delete(camera.id);
    });

  command.run();
  recordProcs.set(camera.id, { command, filename, filepath, startedAt: new Date().toISOString() });
  return recordProcs.get(camera.id);
}

export function stopRecording(cameraId) {
  const rec = recordProcs.get(cameraId);
  if (!rec) return null;
  rec.command.kill('SIGINT');
  recordProcs.delete(cameraId);
  return rec;
}

export function cleanupAll() {
  for (const [id, proc] of streamProcs.entries()) {
    proc.kill('SIGKILL');
    streamProcs.delete(id);
  }
  for (const [id, rec] of recordProcs.entries()) {
    rec.command.kill('SIGINT');
    recordProcs.delete(id);
  }
}
