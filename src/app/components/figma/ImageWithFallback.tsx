import React, { useState, useEffect, useRef } from 'react';

const ERROR_IMG_SRC =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODgiIGhlaWdodD0iODgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgc3Ryb2tlPSIjMDAwIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBvcGFjaXR5PSIuMyIgZmlsbD0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIzLjciPjxyZWN0IHg9IjE2IiB5PSIxNiIgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiByeD0iNiIvPjxwYXRoIGQ9Im0xNiA1OCAxNi0xOCAzMiAzMiIvPjxjaXJjbGUgY3g9IjUzIiBjeT0iMzUiIHI9IjciLz48L3N2Zz4KCg==';

interface ImageWithFallbackProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string | string[];
  priority?: boolean;
}

export function ImageWithFallback({
  src,
  fallbackSrc,
  alt,
  style,
  className,
  priority = false,
  loading = priority ? 'eager' : 'lazy',
  ...rest
}: ImageWithFallbackProps) {
  const [currentSrc, setCurrentSrc] = useState<string | undefined>(src);
  const [fallbackIndex, setFallbackIndex] = useState<number>(0);
  const [didError, setDidError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState<boolean>(priority);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync state if src changes
  useEffect(() => {
    setCurrentSrc(src);
    setFallbackIndex(0);
    setDidError(false);
    setIsLoaded(false);
  }, [src]);

  // Progressive IntersectionObserver for true lazy loading
  useEffect(() => {
    if (priority || isInView) return;

    if (typeof IntersectionObserver === 'undefined') {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '250px' }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [priority, isInView]);

  const handleError = () => {
    if (fallbackSrc) {
      const fallbacks = Array.isArray(fallbackSrc) ? fallbackSrc : [fallbackSrc];
      if (fallbackIndex < fallbacks.length) {
        setCurrentSrc(fallbacks[fallbackIndex]);
        setFallbackIndex(prev => prev + 1);
        setIsLoaded(false);
        return;
      }
    }
    setDidError(true);
  };

  if (didError || !currentSrc) {
    return (
      <div
        className={`inline-block bg-neutral-900/10 text-center align-middle ${className ?? ''}`}
        style={style}
      >
        <div className="flex items-center justify-center w-full h-full aspect-video bg-[#0c0c0f]">
          <img src={ERROR_IMG_SRC} alt="Error loading image" className="w-12 h-12 opacity-20 invert" {...rest} />
        </div>
      </div>
    );
  }

  // If image is from ImageKit, ensure progressive loading and webp/avif auto-compression
  let resolvedSrc = currentSrc;
  if (resolvedSrc && resolvedSrc.includes('ik.imagekit.io') && !resolvedSrc.includes('tr=')) {
    const separator = resolvedSrc.includes('?') ? '&' : '?';
    resolvedSrc = `${resolvedSrc}${separator}tr=f-auto,q-80,pr-true`;
  }

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden">
      {!isLoaded && (
        <div className="absolute inset-0 z-10 bg-[#0c0c0f] animate-shimmer pointer-events-none" />
      )}
      {isInView && (
        <img
          src={resolvedSrc}
          alt={alt}
          className={`${className || ''} transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
          style={style}
          onLoad={() => setIsLoaded(true)}
          onError={handleError}
          loading={loading}
          decoding="async"
          {...rest}
        />
      )}
    </div>
  );
}
