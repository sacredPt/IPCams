import onvif from 'onvif';

function connect(camera) {
  return new Promise((resolve, reject) => {
    // onvif expects xaddr host format
    const cam = new onvif.Cam(
      {
        hostname: camera.ip,
        username: camera.username,
        password: camera.password,
        timeout: 5000
      },
      function onConnect(err) {
        if (err) return reject(err);
        resolve(this);
      }
    );
  });
}

export async function ptzMove(camera, { pan = 0, tilt = 0, zoom = 0 }) {
  const cam = await connect(camera);
  return new Promise((resolve, reject) => {
    cam.continuousMove({ x: Number(pan), y: Number(tilt), zoom: Number(zoom) }, (err) => {
      if (err) return reject(err);
      resolve({ ok: true });
    });
  });
}

export async function testOnvifConnection(camera) {
  const cam = await connect(camera);
  return new Promise((resolve, reject) => {
    cam.getSystemDateAndTime((err, data) => {
      if (err) return reject(err);
      resolve(data);
    });
  });
}
