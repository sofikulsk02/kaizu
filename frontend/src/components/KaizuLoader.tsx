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
        <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-full border-2 border-[var(--border-default)]" />

        {/* Animated round spinning arc */}
        <div className="absolute inset-0 h-12 w-12 sm:h-14 sm:w-14 rounded-full border-2 border-[var(--forest-green)] border-t-[var(--crimson)] border-r-transparent border-b-transparent animate-spin" />
      </div>
    </div>
  );
};
