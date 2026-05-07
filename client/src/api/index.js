
const API = '/api';

const json = (res) => {
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
};

export const fetchCameras = () => fetch(`${API}/cameras`).then(json);
export const createCamera = (payload) => fetch(`${API}/cameras`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }).then(json);
export const updateCamera = (id, payload) => fetch(`${API}/cameras/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }).then(json);
export const deleteCamera = (id) => fetch(`${API}/cameras/${id}`, { method: 'DELETE' }).then(json);
export const cameraAction = (id, action, body={}) => fetch(`${API}/cameras/${id}/${action}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(json);
export const fetchRecordings = () => fetch(`${API}/recordings`).then(json);
export const deleteRecording = (id) => fetch(`${API}/recordings/${id}`, { method: 'DELETE' }).then(json);

const API = 'http://localhost:4000/api';

export const fetchCameras = () => fetch(`${API}/cameras`).then((r) => r.json());
export const createCamera = (payload) => fetch(`${API}/cameras`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }).then((r) => r.json());
export const updateCamera = (id, payload) => fetch(`${API}/cameras/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }).then((r) => r.json());
export const deleteCamera = (id) => fetch(`${API}/cameras/${id}`, { method: 'DELETE' }).then((r) => r.json());
export const cameraAction = (id, action, body={}) => fetch(`${API}/cameras/${id}/${action}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then((r) => r.json());
export const fetchRecordings = () => fetch(`${API}/recordings`).then((r) => r.json());
export const deleteRecording = (id) => fetch(`${API}/recordings/${id}`, { method: 'DELETE' }).then((r) => r.json());

