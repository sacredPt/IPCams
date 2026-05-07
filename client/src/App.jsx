import { useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';
import { cameraAction, createCamera, deleteCamera, fetchRecordings, deleteRecording } from './api';
import HlsPlayer from './components/HlsPlayer';

const socket = io();
const socket = io('http://localhost:4000');
const empty = { name: '', ip: '', username: '', password: '', rtsp_url: '' };

export default function App() {
  const [cameras, setCameras] = useState([]);
  const [form, setForm] = useState(empty);
  const [recordings, setRecordings] = useState([]);

  useEffect(() => {
    socket.on('cameras:update', setCameras);
    return () => socket.off('cameras:update');
  }, []);

  useEffect(() => { fetchRecordings().then(setRecordings); }, [cameras.length]);
  const hls = useMemo(() => (id) => `/hls/camera_${id}/index.m3u8`, []);
  const hls = useMemo(() => (id) => `http://localhost:4000/hls/camera_${id}/index.m3u8`, []);

  return <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 space-y-6">
    <h1 className="text-2xl font-bold">IPCams Lite Dashboard</h1>
    <div className="grid md:grid-cols-5 gap-2">
      {Object.keys(empty).map((k) => <input key={k} placeholder={k} value={form[k]} onChange={(e)=>setForm({...form,[k]:e.target.value})} className="bg-zinc-900 p-2 rounded" />)}
      <button className="bg-blue-600 rounded p-2" onClick={async()=>{await createCamera(form);setForm(empty);}}>Add camera</button>
    </div>
    <div className="grid lg:grid-cols-2 gap-4">
      {cameras.map((c)=><div key={c.id} className="bg-zinc-900 p-3 rounded-xl space-y-2">
        <div className="flex justify-between"><b>{c.name}</b><span>{c.is_streaming ? '🟢 online':'🔴 offline'} {c.is_recording ? ' REC':''}</span></div>
        <HlsPlayer src={hls(c.id)} />
        <div className="flex flex-wrap gap-2">
          <button onClick={()=>cameraAction(c.id,'start')} className="bg-emerald-700 px-2 py-1 rounded">Start</button>
          <button onClick={()=>cameraAction(c.id,'stop')} className="bg-zinc-700 px-2 py-1 rounded">Stop</button>
          <button onClick={()=>cameraAction(c.id,'record/start')} className="bg-red-700 px-2 py-1 rounded">Rec Start</button>
          <button onClick={()=>cameraAction(c.id,'record/stop')} className="bg-red-950 px-2 py-1 rounded">Rec Stop</button>
          <button onClick={async()=>{const r=await cameraAction(c.id,'screenshot'); if(r.downloadUrl) window.open(r.downloadUrl, '_blank');}} className="bg-indigo-700 px-2 py-1 rounded">Screenshot</button>
          <button onClick={async()=>{const r=await cameraAction(c.id,'screenshot'); if(r.downloadUrl) window.open('http://localhost:4000'+r.downloadUrl,'_blank');}} className="bg-indigo-700 px-2 py-1 rounded">Screenshot</button>
          <button onClick={()=>deleteCamera(c.id)} className="bg-zinc-800 px-2 py-1 rounded">Delete</button>
        </div>
        <div className="flex gap-2">
          <button onMouseDown={()=>cameraAction(c.id,'ptz',{pan:-0.2})} className="bg-zinc-800 px-2 rounded">◀</button>
          <button onMouseDown={()=>cameraAction(c.id,'ptz',{tilt:0.2})} className="bg-zinc-800 px-2 rounded">▲</button>
          <button onMouseDown={()=>cameraAction(c.id,'ptz',{tilt:-0.2})} className="bg-zinc-800 px-2 rounded">▼</button>
          <button onMouseDown={()=>cameraAction(c.id,'ptz',{pan:0.2})} className="bg-zinc-800 px-2 rounded">▶</button>
          <input type="range" min="-1" max="1" step="0.1" onChange={(e)=>cameraAction(c.id,'ptz',{zoom:e.target.value})} />
        </div>
      </div>)}
    </div>
    <div className="bg-zinc-900 p-3 rounded-xl">
      <h2 className="font-semibold mb-2">Recordings</h2>
      {recordings.map((r)=><div key={r.id} className="flex gap-2 items-center mb-2">
        <video src={`/recordings/${r.filename}`} controls className="w-72" />
        <video src={`http://localhost:4000/recordings/${r.filename}`} controls className="w-72" />
        <div className="text-sm">{r.filename}</div>
        <button onClick={async()=>{await deleteRecording(r.id); setRecordings(await fetchRecordings());}} className="bg-zinc-700 px-2 py-1 rounded">Delete</button>
      </div>)}
    </div>
  </div>;
}
