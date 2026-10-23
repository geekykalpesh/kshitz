import React from 'react';
import { Film, Play } from 'lucide-react';

interface ShimmerCardProps {
  aspect?: 'video' | 'vertical';
  className?: string;
  dark?: boolean;
}

export function ShimmerCard({ aspect = 'video', className = '', dark = false }: ShimmerCardProps) {
  const isVertical = aspect === 'vertical';

  return (
    <div
      className={`relative overflow-hidden ${
        isVertical ? 'aspect-[9/16]' : 'aspect-video'
      } ${
        dark ? 'bg-[#18181b]' : 'bg-neutral-200'
      } animate-shimmer ${dark ? 'animate-shimmer-dark' : ''} ${className}`}
    >
      {/* Subtle background glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/5 via-transparent to-black/10 pointer-events-none" />

      {/* Center placeholder circle with play hint */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          className={`w-12 h-12 rounded-full border ${
            dark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-white/40'
          } backdrop-blur-sm flex items-center justify-center shadow-sm opacity-50`}
        >
          <Play size={18} className={dark ? 'text-white/30 ml-0.5' : 'text-black/30 ml-0.5'} />
        </div>
      </div>

      {/* Bottom overlay skeleton info */}
      <div className="absolute inset-x-0 bottom-0 p-5 bg-gradient-to-t from-black/60 via-black/20 to-transparent flex flex-col justify-end gap-2.5 pointer-events-none">
        {/* Title bar placeholder */}
        <div className="h-4 w-4/5 rounded bg-white/30 backdrop-blur-sm animate-pulse" />
        {/* Secondary subtitle line */}
        <div className="h-3 w-1/2 rounded bg-white/20 backdrop-blur-sm animate-pulse" />
        {/* Tag pills skeleton */}
        <div className="flex gap-1.5 pt-1">
          <div className="h-3.5 w-14 rounded-full bg-white/25 backdrop-blur-sm" />
          <div className="h-3.5 w-16 rounded-full bg-white/20 backdrop-blur-sm" />
        </div>
      </div>
    </div>
  );
}

export function ShimmerCarousel({ count = 4 }: { count?: number }) {
  return (
    <div className="overflow-x-auto no-scrollbar scroll-smooth">
      <div className="flex gap-0 min-w-max">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="w-[340px] sm:w-[420px] md:w-[480px] flex-shrink-0">
            <ShimmerCard aspect="video" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ShimmerGrid({
  count = 6,
  aspect = 'video',
  cols = 3,
}: {
  count?: number;
  aspect?: 'video' | 'vertical';
  cols?: 3 | 5;
}) {
  const gridClasses =
    cols === 5
      ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-0'
      : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0';

  return (
    <div className={gridClasses}>
      {Array.from({ length: count }).map((_, i) => (
        <ShimmerCard key={i} aspect={aspect} />
      ))}
    </div>
  );
}

export function ShimmerFilters() {
  const widths = ['w-14', 'w-20', 'w-24', 'w-20', 'w-16'];
  return (
    <div className="flex gap-3 flex-wrap">
      {widths.map((w, idx) => (
        <div
          key={idx}
          className={`h-9 ${w} rounded-full bg-neutral-200 animate-shimmer border border-black/10`}
        />
      ))}
    </div>
  );
}

export function ShimmerAdminStats() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {[1, 2, 3, 4].map(i => (
        <div
          key={i}
          className="p-4 rounded-xl bg-neutral-900 border border-white/10 animate-shimmer animate-shimmer-dark space-y-2"
        >
          <div className="h-3 w-20 rounded bg-white/20" />
          <div className="h-7 w-12 rounded bg-white/40" />
        </div>
      ))}
    </div>
  );
}
