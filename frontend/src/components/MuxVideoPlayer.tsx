import { useEffect, useRef } from 'react';
import mux from 'mux-embed';
import Hls from 'hls.js';

const MUX_ENV_KEY = '3k0g9lnpa0nrr832mpfdsl6sa';

interface MuxVideoPlayerProps {
  src: string;
  poster?: string;
  title: string;
  videoId?: string | number;
  className?: string;
  autoPlay?: boolean;
  controls?: boolean;
}

export function MuxVideoPlayer({
  src,
  poster,
  title,
  videoId,
  className = "w-full h-full object-contain",
  autoPlay = true,
  controls = true,
}: MuxVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Setup HLS playback for Mux streaming URLs (.m3u8)
  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl || !src) return;

    let hls: Hls | null = null;
    const isM3U8 = src.includes('.m3u8');

    if (isM3U8) {
      if (videoEl.canPlayType('application/vnd.apple.mpegurl')) {
        // Native HLS support (Safari iOS / macOS)
        videoEl.src = src;
      } else if (Hls.isSupported()) {
        hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
        });
        hls.loadSource(src);
        hls.attachMedia(videoEl);
      } else {
        videoEl.src = src;
      }
    } else {
      videoEl.src = src;
    }

    return () => {
      if (hls) {
        hls.destroy();
      }
    };
  }, [src]);

  // Setup Mux Data monitoring
  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    const initTime = mux.utils ? mux.utils.now() : Date.now();

    try {
      mux.monitor(videoEl, {
        debug: false,
        data: {
          env_key: MUX_ENV_KEY,
          player_name: 'Kshitij Portfolio Player',
          player_init_time: initTime,
          video_id: String(videoId || src),
          video_title: title || 'Portfolio Video',
          video_stream_type: 'on-demand',
        },
      });
    } catch (err) {
      console.warn('Mux Data monitor init error:', err);
    }

    return () => {
      try {
        if (videoEl && (videoEl as any).mux && typeof (videoEl as any).mux.destroy === 'function') {
          (videoEl as any).mux.destroy();
        }
      } catch (e) {
        // cleanup error ignored
      }
    };
  }, [src, videoId, title]);

  return (
    <video
      ref={videoRef}
      poster={poster}
      className={className}
      controls={controls}
      autoPlay={autoPlay}
      playsInline
      preload="metadata"
    />
  );
}
