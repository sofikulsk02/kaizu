"use client";

import React, { useState, useEffect } from "react";

interface KaizuLoaderProps {
  title?: string;
  subtitle?: string;
}

const KAIZEN_WISDOM = [
  {
    jp: "千里の行も足下に始まる",
    en: "A journey of a thousand miles begins beneath your feet.",
    source: "Laozi · Kaizen Principle",
  },
  {
    jp: "小事をおろそかにするなかれ",
    en: "1% daily improvement compounds into remarkable transformation.",
    source: "Atomic Steps · 改善",
  },
  {
    jp: "反省なくして進歩なし",
    en: "Consistent action and honest reflection cultivate genuine mastery.",
    source: "Hansei Reflection · 反省",
  },
  {
    jp: "継続は力なり",
    en: "Continuity is power — showing up every single day is already victory.",
    source: "Daily Momentum · 継続",
  },
];

export const KaizuLoader: React.FC<KaizuLoaderProps> = ({
  title = "Connecting to Kaizu Cloud OS",
  subtitle = "Waking up cloud server & preparing your study canvas...",
}) => {
  const [wisdomIdx, setWisdomIdx] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setWisdomIdx((prev) => (prev + 1) % KAIZEN_WISDOM.length);
        setFade(true);
      }, 400);
    }, 4500);

    return () => clearInterval(timer);
  }, []);

  const wisdom = KAIZEN_WISDOM[wisdomIdx];

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-6 text-center bg-[var(--bg-main)] relative z-10 selection:bg-[var(--pale-sage)]">
      {/* Centered Floating Paper Card */}
      <div className="paper-card p-6 sm:p-8 max-w-md w-full border border-[var(--border-default)] shadow-xl relative overflow-hidden backdrop-blur-sm card-lift">
        {/* Subtle Decorative Ambient Glow */}
        <div
          className="absolute -top-16 -left-16 w-32 h-32 rounded-full pointer-events-none opacity-20 blur-2xl"
          style={{ backgroundColor: "var(--forest-green)" }}
        />
        <div
          className="absolute -bottom-16 -right-16 w-32 h-32 rounded-full pointer-events-none opacity-15 blur-2xl"
          style={{ backgroundColor: "var(--crimson)" }}
        />

        {/* Custom Zen Ensō (円相) + Hanko Seal Loader */}
        <div className="relative mx-auto w-24 h-24 mb-5 flex items-center justify-center">
          {/* Subtle Outer Pulsing Wave Ripple */}
          <div className="absolute inset-0 rounded-full border border-[var(--forest-green)]/20 ripple-pulse-anim" />

          {/* SVG Ensō Zen Circle */}
          <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
            {/* Background subtle track */}
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="var(--border-subtle)"
              strokeWidth="3.5"
            />
            {/* Animated Ensō brush stroke */}
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="url(#ensoGradient)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray="251.2"
              className="enso-circle-anim"
            />
            <defs>
              <linearGradient id="ensoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="var(--forest-green)" />
                <stop offset="50%" stopColor="var(--crimson)" />
                <stop offset="100%" stopColor="var(--forest-green)" />
              </linearGradient>
            </defs>
          </svg>

          {/* Center Hanko Seal (Japanese Vermilion Stamp) */}
          <div className="absolute inset-0 flex items-center justify-center zen-breathe-anim pointer-events-none">
            <div className="w-10 h-10 rounded-lg bg-[var(--crimson)] text-white shadow-md flex flex-col items-center justify-center border border-white/20">
              <span className="text-sm font-black tracking-widest leading-none select-none">
                佳
              </span>
              <span className="text-[7px] font-bold tracking-tighter opacity-80 leading-none mt-0.5 select-none">
                図
              </span>
            </div>
          </div>
        </div>

        {/* Title & Status Badge */}
        <div className="space-y-1.5 mb-4">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[var(--surface-secondary)] border border-[var(--border-subtle)] text-[10px] font-bold text-[var(--forest-green)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--forest-green)] animate-ping" />
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--forest-green)]" />
            <span>Workspace Sync</span>
          </div>

          <h2 className="text-base sm:text-lg font-black text-[var(--text-heading)] tracking-tight">
            {title}
          </h2>

          <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed max-w-xs mx-auto">
            {subtitle}
          </p>
        </div>

        {/* Fluid Shimmer Progress Track */}
        <div className="w-full h-1.5 bg-[var(--surface-secondary)] rounded-full overflow-hidden border border-[var(--border-subtle)] relative mb-5">
          <div className="absolute inset-y-0 w-2/5 rounded-full bg-gradient-to-r from-transparent via-[var(--forest-green)] to-transparent wave-shimmer-anim" />
        </div>

        {/* Meditative Kaizen Wisdom Quote Box */}
        <div className="paper-inset p-3 bg-[var(--surface-secondary)] border border-[var(--border-subtle)] rounded-lg text-left transition-opacity duration-300">
          <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-wider text-[var(--text-muted)] mb-1">
            <span>Daily Kaizen Thought</span>
            <span className="text-[var(--forest-green)] font-bold">{wisdom.source}</span>
          </div>

          <div
            className={`transition-opacity duration-300 ${
              fade ? "opacity-100" : "opacity-0"
            }`}
          >
            <div className="text-xs font-bold text-[var(--text-heading)] font-serif">
              「 {wisdom.jp} 」
            </div>
            <div className="text-[10px] text-[var(--text-secondary)] mt-0.5 leading-relaxed">
              {wisdom.en}
            </div>
          </div>
        </div>

        {/* Subtle reassuring note about Render cold starts */}
        <div className="mt-3.5 text-[10px] text-[var(--text-muted)] flex items-center justify-center gap-1">
          <span>🌿</span>
          <span>Free-tier cloud boot may take ~30s on cold start</span>
        </div>
      </div>
    </div>
  );
};
