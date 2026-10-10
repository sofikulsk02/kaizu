"use client";

import React, { useState, useEffect } from "react";
import { Api, setActiveUserId, setJwtToken } from "../lib/api";
import { getActiveThemeId, applyTheme } from "../lib/theme";

interface LoginScreenProps {
  onLoginSuccess: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [showDevLogin, setShowDevLogin] = useState(false);

  useEffect(() => {
    const savedTheme = getActiveThemeId();
    applyTheme(savedTheme);
  }, []);

  const presetUsers = [
    {
      id: "11111111-1111-1111-1111-111111111111",
      name: "User A (Primary Learner)",
      email: "usera@kaizu.app",
    },
    {
      id: "22222222-2222-2222-2222-222222222222",
      name: "User B (Secondary Learner)",
      email: "userb@kaizu.app",
    },
    {
      id: "00000000-0000-0000-0000-000000000001",
      name: "Default Dev Learner",
      email: "learner@kaizu.app",
    },
  ];

  const handleGoogleLogin = async () => {
    setLoadingGoogle(true);
    try {
      const res = await Api.getGoogleAuthUrl();
      if (res.url) {
        window.location.href = res.url;
      }
    } catch (err: any) {
      alert(
        err.message ||
          "Failed to initiate Google Login. Make sure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are configured in backend .env"
      );
      setLoadingGoogle(false);
    }
  };

  const handleDevLogin = async (userId: string, email: string, name: string) => {
    try {
      const res = await Api.createDevUser({ id: userId, email, name });
      if (res.token) {
        setJwtToken(res.token);
      }
      setActiveUserId(userId);
      onLoginSuccess();
    } catch (err: any) {
      alert(err.message || "Failed to sign in with dev user");
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center p-4 sm:p-6 font-sans overflow-hidden bg-[var(--bg-main)]">
      {/* Washi Paper Visible Background Overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center pointer-events-none opacity-45 mix-blend-multiply"
        style={{ backgroundImage: `url('/washi-bg.jpg')` }}
      />

      {/* Subtle organic radial spotlight behind card */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,_transparent_30%,_rgba(0,0,0,0.05)_100%)]" />

      {/* Login Screen Card */}
      <div className="relative z-10 w-full max-w-md space-y-6">
        <div className="paper-card p-8 text-center space-y-6 bg-[var(--surface-primary)] border border-[var(--border-default)] shadow-2xl rounded-2xl">
          {/* Logo Badge */}
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-[var(--crimson)] text-xl font-black text-white shadow-md">
            改善
          </div>

          <div>
            <h1 className="text-3xl font-black tracking-tight text-[var(--forest-green)]">
              KAIZU
            </h1>
            <p className="mt-1 text-xs font-semibold text-[var(--text-muted)]">
              Continuous Improvement Operating System
            </p>
          </div>

          {/* Tagline Badge */}
          <div className="inline-flex items-center space-x-1.5 bg-[var(--surface-secondary)] px-4 py-2 text-xs font-bold text-[var(--text-muted)] rounded-lg border border-[var(--border-default)]">
            <span className="text-[var(--forest-green)]">PLAN</span>
            <span>→</span>
            <span className="text-[var(--forest-green)]">DO</span>
            <span>→</span>
            <span className="text-[var(--crimson)]">REFLECT</span>
            <span>→</span>
            <span className="text-[var(--sage)]">IMPROVE</span>
          </div>

          <p className="text-xs text-[var(--text-muted)] max-w-xs mx-auto leading-relaxed">
            Turn intentions into consistent action, visible progress, honest reflection, and better next steps.
          </p>

          {/* Primary Crisp Google Login Button */}
          <button
            onClick={handleGoogleLogin}
            disabled={loadingGoogle}
            className="paper-btn-secondary w-full py-3.5 px-6 text-sm flex items-center justify-center space-x-3 cursor-pointer bg-[var(--surface-primary)] border border-[var(--border-default)] shadow-xs hover:bg-[var(--surface-secondary)]"
          >
            <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.15C3.26 21.3 7.37 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.61H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.39l3.99-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.37 0 3.26 2.7 1.29 6.61l3.99 3.15c.95-2.85 3.6-4.96 6.72-4.96z"
              />
            </svg>
            <span className="text-[var(--text-heading)] font-bold text-sm">
              {loadingGoogle ? "Connecting to Google..." : "Sign in with Google"}
            </span>
          </button>

          {/* Dev / Testing Accordion Switcher */}
          <div className="pt-2 border-t border-[var(--border-default)]">
            <button
              onClick={() => setShowDevLogin(!showDevLogin)}
              className="text-[11px] font-semibold text-[var(--text-muted)] hover:text-[var(--text-heading)]"
            >
              {showDevLogin ? "Hide Dev Mode Login ▲" : "Developer / Testing Mode ▼"}
            </button>

            {showDevLogin && (
              <div className="mt-3 space-y-2 text-left">
                <p className="text-[10px] text-[var(--text-muted)] italic text-center">
                  Select a test user to test multi-user database security:
                </p>
                {presetUsers.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleDevLogin(user.id, user.email, user.name)}
                    className="paper-card-interactive w-full p-3 text-left flex items-center justify-between text-xs bg-[var(--surface-secondary)] border border-[var(--border-default)]"
                  >
                    <div>
                      <div className="font-bold text-[var(--text-heading)]">{user.name}</div>
                      <div className="text-[10px] text-[var(--text-muted)]">{user.email}</div>
                    </div>
                    <span className="text-xs font-bold text-[var(--crimson)]">Login →</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-[11px] font-medium text-[var(--text-muted)]">
          Strict server-side user data security & ownership enforced.
        </p>
      </div>
    </div>
  );
};
