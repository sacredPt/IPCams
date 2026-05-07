# IPCams Lite (Node.js + React)

Простой self-hosted проект для IP-камер с RTSP/HLS, PTZ (ONVIF), скриншотами, записью и playback.

## Структура

- `server` — backend (Express, Socket.IO, sqlite3, ONVIF, FFmpeg)
- `client` — frontend (React, Vite, Tailwind)
- `storage/hls` — HLS playlists + segments
- `storage/recordings` — mp4 записи
- `storage/screenshots` — jpg снимки

## Backend API

- `GET /api/cameras`
- `POST /api/cameras`
- `PUT /api/cameras/:id`
- `DELETE /api/cameras/:id`
- `POST /api/cameras/:id/start`
- `POST /api/cameras/:id/stop`
- `POST /api/cameras/:id/screenshot`
- `POST /api/cameras/:id/record/start`
- `POST /api/cameras/:id/record/stop`
- `POST /api/cameras/:id/ptz`
- `GET /api/recordings`

## Установка

```bash
npm run install:all
```

## Запуск

Терминал 1:
```bash
npm --prefix server run dev
```

Терминал 2:
```bash
npm --prefix client run dev
```

Frontend: `http://localhost:5173`
Backend: `http://localhost:4000`

## FFmpeg

В проекте используется пакет `ffmpeg-static`, который автоматически поставляет бинарник FFmpeg для Windows/Linux/macOS.

Если хотите системный ffmpeg вручную:
- Ubuntu/Debian: `sudo apt install ffmpeg`
- Windows: `choco install ffmpeg` или `winget install Gyan.FFmpeg`

## Пример RTSP URL

```text
rtsp://admin:password@192.168.1.64:554/Streaming/Channels/101
```

## Docker (optional)

```yaml
services:
  app:
    image: node:20
    working_dir: /app
    volumes:
      - ./:/app
    command: bash -lc "npm run install:all && npm --prefix server run dev"
    ports:
      - "4000:4000"
```

## Примечания

- Для ONVIF PTZ камера должна поддерживать PTZ profile.
- HLS и запись используют RTSP-поток камеры.
