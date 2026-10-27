import { useEffect, useRef } from 'react';

interface PortfolioVideoPlayerProps {
  src: string;
  poster?: string;
  title?: string;
  videoId?: string | number;
  className?: string;
  autoPlay?: boolean;
  controls?: boolean;
}

export function PortfolioVideoPlayer({
  src,
  poster,
  title,
  className = "w-full h-full object-contain",
  autoPlay = true,
  controls = true,
}: PortfolioVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl || !src) return;
    videoEl.src = src;
  }, [src]);

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

// Retain backwards-compatibility export if anything imports MuxVideoPlayer
export const MuxVideoPlayer = PortfolioVideoPlayer;
