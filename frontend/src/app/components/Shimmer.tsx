import React from 'react';
import { Film } from 'lucide-react';

interface ShimmerCardProps {
  aspect?: 'video' | 'vertical';
  className?: string;
  dark?: boolean;
}

export function ShimmerCard({ aspect = 'video', className = '', dark = true }: ShimmerCardProps) {
  const isVertical = aspect === 'vertical';

  return (
    <div
      className={`relative overflow-hidden ${
        isVertical ? 'aspect-[9/16]' : 'aspect-video'
      } bg-[#0c0c0f] border border-white/[0.07] animate-shimmer ${className}`}
    >
      {/* Luxury subtle ambient radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(255,255,255,0.03),transparent_70%)] pointer-events-none" />

      {/* Center minimalist frosted lens emblem */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-12 h-12 rounded-full border border-white/[0.08] bg-white/[0.03] backdrop-blur-md flex items-center justify-center shadow-2xl">
          <Film size={18} className="text-white/35 ml-0.5 animate-pulse" />
        </div>
      </div>

      {/* Bottom overlay skeleton info with glassmorphism */}
      <div className="absolute inset-x-0 bottom-0 p-5 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end gap-2.5 pointer-events-none">
        {/* Title bar placeholder with sleek gradient */}
        <div className="h-3.5 w-3/5 rounded bg-white/[0.14] backdrop-blur-sm" />
        {/* Secondary subtitle line */}
        <div className="h-2.5 w-1/3 rounded bg-white/[0.07] backdrop-blur-sm" />
        {/* Tag pills skeleton */}
        <div className="flex gap-2 pt-1 items-center">
          <div className="h-4 w-14 rounded-full bg-white/[0.06] border border-white/[0.08]" />
          <div className="h-4 w-16 rounded-full bg-white/[0.04] border border-white/[0.06]" />
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
  const widths = ['w-16', 'w-24', 'w-28', 'w-20', 'w-24'];
  return (
    <div className="flex gap-2.5 flex-wrap">
      {widths.map((w, idx) => (
        <div
          key={idx}
          className={`h-9 ${w} rounded-full bg-[#121217] border border-white/[0.08] animate-shimmer`}
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
          className="p-5 rounded-2xl bg-[#0f0f13] border border-white/[0.08] animate-shimmer space-y-2.5 shadow-xl"
        >
          <div className="h-3 w-20 rounded bg-white/[0.12]" />
          <div className="h-7 w-14 rounded bg-white/[0.25]" />
        </div>
      ))}
    </div>
  );
}
