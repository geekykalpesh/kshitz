"use client";
import React, { useMemo, useRef, useState } from "react";
import { cn } from "@/app/components/ui/utils";

export const BackgroundRippleEffect = ({
  children,
  className,
  rows = 12,
  cols = 30,
  cellSize = 60,
}: {
  children?: React.ReactNode;
  className?: string;
  rows?: number;
  cols?: number;
  cellSize?: number;
}) => {
  const [clickedCell, setClickedCell] = useState<{
    row: number;
    col: number;
  } | null>(null);
  const [rippleKey, setRippleKey] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const gridWidth = cols * cellSize;
    const gridHeight = rows * cellSize;
    
    const startX = (rect.width - gridWidth) / 2;
    const startY = (rect.height - gridHeight) / 2;
    
    const col = Math.floor((x - startX) / cellSize);
    const row = Math.floor((y - startY) / cellSize);
    
    if (col >= 0 && col < cols && row >= 0 && row < rows) {
      setClickedCell({ row, col });
      setRippleKey((k) => k + 1);
    }
  };

  return (
    <div
      ref={containerRef}
      onClick={handleContainerClick}
      className={cn(
        "relative w-full overflow-hidden bg-white flex items-center justify-center cursor-crosshair",
        className
      )}
    >
      <div className="absolute inset-0 z-0 flex items-center justify-center overflow-hidden pointer-events-none">
        <DivGrid
          key={`ripple-${rippleKey}`}
          rows={rows}
          cols={cols}
          cellSize={cellSize}
          clickedCell={clickedCell}
        />
      </div>
      <div className="relative z-10 w-full pointer-events-none">
        <div className="pointer-events-auto">
          {children}
        </div>
      </div>
      <style>{`
        @keyframes ripple-animation {
          0% {
            background-color: transparent;
            opacity: 0.3;
          }
          20% {
            background-color: rgba(0, 0, 0, 0.08);
            opacity: 1;
          }
          100% {
            background-color: transparent;
            opacity: 0.3;
          }
        }
        .animate-ripple {
          animation: ripple-animation var(--duration) ease-out var(--delay) forwards;
        }
      `}</style>
    </div>
  );
};

type DivGridProps = {
  rows: number;
  cols: number;
  cellSize: number;
  clickedCell: { row: number; col: number } | null;
};

const DivGrid = ({
  rows,
  cols,
  cellSize,
  clickedCell,
}: DivGridProps) => {
  const cells = useMemo(() => Array.from({ length: rows * cols }), [rows, cols]);

  return (
    <div 
      className="grid" 
      style={{ 
        gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
        gridTemplateRows: `repeat(${rows}, ${cellSize}px)`,
      }}
    >
      {cells.map((_, idx) => {
        const r = Math.floor(idx / cols);
        const c = idx % cols;
        const distance = clickedCell
          ? Math.hypot(clickedCell.row - r, clickedCell.col - c)
          : 0;
        const delay = clickedCell ? distance * 50 : 0;
        const duration = 400 + distance * 40;

        return (
          <div
            key={`${r}-${c}`}
            className={cn(
              "border-[0.5px] border-black/15 opacity-30 transition-all duration-300",
              clickedCell && "animate-ripple"
            )}
            style={{
              width: cellSize,
              height: cellSize,
              ["--delay" as any]: `${delay}ms`,
              ["--duration" as any]: `${duration}ms`,
            } as React.CSSProperties}
          />
        );
      })}
    </div>
  );
};
