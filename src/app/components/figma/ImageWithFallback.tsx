import React, { useState, useEffect } from 'react';

const ERROR_IMG_SRC =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODgiIGhlaWdodD0iODgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgc3Ryb2tlPSIjMDAwIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBvcGFjaXR5PSIuMyIgZmlsbD0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIzLjciPjxyZWN0IHg9IjE2IiB5PSIxNiIgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiByeD0iNiIvPjxwYXRoIGQ9Im0xNiA1OCAxNi0xOCAzMiAzMiIvPjxjaXJjbGUgY3g9IjUzIiBjeT0iMzUiIHI9IjciLz48L3N2Zz4KCg==';

interface ImageWithFallbackProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string | string[];
}

export function ImageWithFallback({ src, fallbackSrc, alt, style, className, ...rest }: ImageWithFallbackProps) {
  const [currentSrc, setCurrentSrc] = useState<string | undefined>(src);
  const [fallbackIndex, setFallbackIndex] = useState<number>(0);
  const [didError, setDidError] = useState(false);

  // Sync state if src changes
  useEffect(() => {
    setCurrentSrc(src);
    setFallbackIndex(0);
    setDidError(false);
  }, [src]);

  const handleError = () => {
    if (fallbackSrc) {
      const fallbacks = Array.isArray(fallbackSrc) ? fallbackSrc : [fallbackSrc];
      if (fallbackIndex < fallbacks.length) {
        setCurrentSrc(fallbacks[fallbackIndex]);
        setFallbackIndex(prev => prev + 1);
        return;
      }
    }
    setDidError(true);
  };

  if (didError || !currentSrc) {
    return (
      <div
        className={`inline-block bg-neutral-900/5 text-center align-middle ${className ?? ''}`}
        style={style}
      >
        <div className="flex items-center justify-center w-full h-full aspect-video bg-neutral-900/10">
          <img src={ERROR_IMG_SRC} alt="Error loading image" className="w-12 h-12 opacity-20 invert" {...rest} />
        </div>
      </div>
    );
  }

  return (
    <img
      src={currentSrc}
      alt={alt}
      className={className}
      style={style}
      onError={handleError}
      {...rest}
    />
  );
}
