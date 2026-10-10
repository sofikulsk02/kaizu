"use client";

import React, { useEffect, useState } from "react";
import { Download, Share, X, Smartphone } from "lucide-react";

export const PwaRegister: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    // 1. Register Service Worker
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((reg) => {
            console.log("⚡ [PWA] Service Worker registered:", reg.scope);
          })
          .catch((err) => {
            console.warn("⚠️ [PWA] Service Worker registration failed:", err);
          });
      });
    }

    // 2. Check if already running as installed standalone app
    const checkStandalone = (): boolean => {
      const isStandaloneMode =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone === true;
      setIsStandalone(isStandaloneMode);
      return isStandaloneMode;
    };

    checkStandalone();

    // 3. Detect iOS device
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(isIosDevice);

    // Check if dismissed before in session
    const dismissed = sessionStorage.getItem("kaizu_pwa_dismissed");

    // 4. Capture Chrome / Android / Edge install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!dismissed) {
        setShowInstallPrompt(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // If on iOS and not standalone and not dismissed, show prompt after 3s
    if (isIosDevice && !checkStandalone() && !dismissed) {
      const timer = setTimeout(() => {
        setShowInstallPrompt(true);
      }, 3500);
      return () => clearTimeout(timer);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setShowInstallPrompt(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    sessionStorage.setItem("kaizu_pwa_dismissed", "true");
  };

  // Don't render banner if already installed as standalone
  if (isStandalone || !showInstallPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--border-default)] bg-[var(--surface-primary)] p-3.5 shadow-2xl backdrop-blur-md">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--crimson)] text-lg font-black text-white shadow-sm">
            改善
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-[var(--text-heading)] truncate flex items-center gap-1.5">
              <span>Install Kaizu on Mobile</span>
              <span className="inline-flex items-center rounded-full bg-[var(--sage)]/20 px-1.5 py-0.5 text-[9px] font-semibold text-[var(--forest-green)]">
                PWA
              </span>
            </h4>
            <p className="text-[11px] text-[var(--text-muted)] truncate">
              {isIos
                ? "Tap Share ⎋ then 'Add to Home Screen' ⊕"
                : "Install as a native app for faster mobile access"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {deferredPrompt ? (
            <button
              onClick={handleInstallClick}
              className="flex items-center gap-1.5 rounded-xl bg-[var(--forest-green)] px-3 py-1.5 text-xs font-bold text-white shadow-xs transition hover:opacity-90 active:scale-95"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Install</span>
            </button>
          ) : isIos ? (
            <div className="flex items-center gap-1 text-[11px] font-bold text-[var(--forest-green)] bg-[var(--surface-secondary)] border border-[var(--border-default)] px-2.5 py-1.5 rounded-xl">
              <Share className="h-3.5 w-3.5" />
              <span>Share</span>
            </div>
          ) : (
            <button
              onClick={handleDismiss}
              className="flex items-center gap-1.5 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border-default)] px-3 py-1.5 text-xs font-bold text-[var(--text-heading)] hover:bg-[var(--surface-hover)]"
            >
              <Smartphone className="h-3.5 w-3.5 text-[var(--forest-green)]" />
              <span>OK</span>
            </button>
          )}

          <button
            onClick={handleDismiss}
            aria-label="Dismiss banner"
            className="rounded-lg p-1 text-[var(--text-muted)] hover:bg-[var(--surface-secondary)] hover:text-[var(--text-heading)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
