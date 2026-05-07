import { useEffect, useRef } from 'react';
import Hls from 'hls.js';

export default function HlsPlayer({ src }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!src || !ref.current) return;
    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(src);
      hls.attachMedia(ref.current);
      return () => hls.destroy();
    }
    ref.current.src = src;
  }, [src]);

  return <video ref={ref} controls autoPlay muted className="w-full rounded" />;
}
