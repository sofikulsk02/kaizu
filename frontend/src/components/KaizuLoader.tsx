"use client";

import React from "react";

interface KaizuLoaderProps {
  className?: string;
}

export const KaizuLoader: React.FC<KaizuLoaderProps> = ({ className = "" }) => {
  return (
    <div className={`flex min-h-screen items-center justify-center bg-[var(--bg-main)] ${className}`}>
      <div className="relative flex items-center justify-center">
        {/* Subtle circular track */}
        <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-full border-2 border-[var(--border-default)]" />

        {/* Animated round spinning arc */}
        <div className="absolute inset-0 h-14 w-14 sm:h-16 sm:w-16 rounded-full border-2 border-[var(--forest-green)] border-t-[var(--crimson)] border-r-transparent border-b-transparent animate-spin" />

        {/* Kaizu 改善 icon in the center */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-md bg-[var(--crimson)] text-white font-bold text-xs sm:text-sm shadow-xs select-none">
            改善
          </div>
        </div>
      </div>
    </div>
  );
};
