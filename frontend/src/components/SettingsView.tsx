"use client";

import React, { useState, useEffect } from "react";
import { clearAuth, getJwtToken, Api, User } from "../lib/api";
import { THEMES, getActiveThemeId, applyTheme } from "../lib/theme";
import { Palette, Globe, Check } from "lucide-react";

interface SettingsViewProps {
  onUserChanged: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onUserChanged }) => {
  const jwtToken = getJwtToken();

  const [activeUser, setActiveUser] = useState<User | null>(null);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [selectedThemeId, setSelectedThemeId] = useState<string>("theme-matcha-ricepaper");
  const [themeFilter, setThemeFilter] = useState<"all" | "light" | "dark">("all");

  useEffect(() => {
    setSelectedThemeId(getActiveThemeId());
    Api.getMe()
      .then((u) => setActiveUser(u))
      .catch(() => setActiveUser(null));
  }, [jwtToken]);

  const handleSelectTheme = (themeId: string) => {
    setSelectedThemeId(themeId);
    applyTheme(themeId);
  };

  const handleGoogleLogin = async () => {
    setLoadingGoogle(true);
    try {
      const res = await Api.getGoogleAuthUrl();
      if (res.url) {
        window.location.href = res.url;
      }
    } catch (err: any) {
      alert(err.message || "Failed to initiate Google Login. Make sure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are configured in backend .env");
      setLoadingGoogle(false);
    }
  };

  const handleLogout = () => {
    clearAuth();
    onUserChanged();
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-[var(--text-heading)] sm:text-3xl">Settings & Workspace Themes</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Manage paper minimalism visual theme palettes, account identity, and workspace preferences.
        </p>
      </div>

      {/* Theme Palette Switcher Plate Section */}
      <div className="paper-card p-6 space-y-5 border border-[var(--border-default)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--pale-sage)] text-[var(--forest-green)] shadow-xs">
              <Palette className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[var(--text-heading)]">Theme Palette Switcher</h2>
              <p className="text-xs text-[var(--text-muted)]">Select your preferred paper color palette below</p>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center p-1 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border-default)] text-xs font-bold self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setThemeFilter("all")}
              className={`px-3 py-1 rounded transition cursor-pointer ${
                themeFilter === "all"
                  ? "bg-[var(--surface-primary)] text-[var(--text-heading)] shadow-2xs font-extrabold"
                  : "text-[var(--text-muted)] hover:text-[var(--text-heading)]"
              }`}
            >
              All ({THEMES.length})
            </button>
            <button
              type="button"
              onClick={() => setThemeFilter("light")}
              className={`px-3 py-1 rounded transition cursor-pointer ${
                themeFilter === "light"
                  ? "bg-[var(--surface-primary)] text-[var(--text-heading)] shadow-2xs font-extrabold"
                  : "text-[var(--text-muted)] hover:text-[var(--text-heading)]"
              }`}
            >
              Light ({THEMES.filter((t) => t.category === "light").length})
            </button>
            <button
              type="button"
              onClick={() => setThemeFilter("dark")}
              className={`px-3 py-1 rounded transition cursor-pointer ${
                themeFilter === "dark"
                  ? "bg-[var(--surface-primary)] text-[var(--text-heading)] shadow-2xs font-extrabold"
                  : "text-[var(--text-muted)] hover:text-[var(--text-heading)]"
              }`}
            >
              Dark ({THEMES.filter((t) => t.category === "dark").length})
            </button>
          </div>
        </div>

        <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3 pt-2">
          {THEMES.filter((t) => (themeFilter === "all" ? true : t.category === themeFilter)).map((theme) => {
            const isSelected = selectedThemeId === theme.id;
            return (
              <div
                key={theme.id}
                onClick={() => handleSelectTheme(theme.id)}
                className={`group cursor-pointer rounded-xl p-3.5 transition-all flex flex-col justify-between border card-lift relative overflow-hidden ${
                  isSelected
                    ? "paper-card border-[var(--forest-green)] ring-2 ring-[var(--forest-green)]/30 shadow-md scale-[1.01]"
                    : "paper-card bg-[var(--surface-secondary)] border-[var(--border-default)] hover:border-[var(--forest-green)]/60 hover:shadow-xs"
                }`}
              >
                {/* Visual Theme Preview Banner */}
                <div
                  className="h-20 w-full rounded-lg p-2.5 flex flex-col justify-between border border-black/10 dark:border-white/10 shadow-inner relative overflow-hidden transition-transform group-hover:scale-[1.01]"
                  style={{ backgroundColor: theme.colors[1] }}
                >
                  {/* Miniature Surface Window Preview */}
                  <div
                    className="h-9 w-full rounded-md px-2.5 flex items-center justify-between border border-black/5 dark:border-white/10 shadow-2xs"
                    style={{ backgroundColor: theme.colors[2] }}
                  >
                    <div className="flex items-center space-x-2">
                      <div
                        className="h-4 w-4 rounded-full flex items-center justify-center text-[9px] font-black text-white shadow-2xs shrink-0"
                        style={{ backgroundColor: theme.colors[0] }}
                      >
                        佳
                      </div>
                      <div className="space-y-0.5">
                        <div
                          className="h-1.5 w-12 rounded-full"
                          style={{ backgroundColor: theme.colors[0], opacity: 0.9 }}
                        />
                        <div
                          className="h-1 w-7 rounded-full"
                          style={{ backgroundColor: theme.colors[3], opacity: 0.7 }}
                        />
                      </div>
                    </div>
                    <div
                      className="px-1.5 py-0.5 rounded text-[9px] font-bold"
                      style={{
                        backgroundColor: `${theme.colors[0]}18`,
                        color: theme.colors[0],
                      }}
                    >
                      Kaizu
                    </div>
                  </div>

                  {/* Overlapping Swatch Ring & Category Tag */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center -space-x-1">
                      {theme.colors.map((color, idx) => (
                        <div
                          key={idx}
                          className="h-4 w-4 rounded-full border border-white/80 dark:border-neutral-900 shadow-2xs"
                          style={{ backgroundColor: color }}
                          title={`${theme.labels[idx]}: ${color}`}
                        />
                      ))}
                    </div>
                    <span
                      className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded shadow-2xs"
                      style={{
                        backgroundColor: theme.category === "dark" ? "rgba(0,0,0,0.4)" : "rgba(255,255,255,0.75)",
                        color: theme.category === "dark" ? "#E2E8F0" : "#1A202C",
                      }}
                    >
                      {theme.category}
                    </span>
                  </div>
                </div>

                {/* Theme Name, Tagline & Description */}
                <div className="mt-3 space-y-1">
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="text-sm font-bold text-[var(--text-heading)] group-hover:text-[var(--forest-green)] transition-colors">
                      {theme.name}
                    </span>
                    {isSelected ? (
                      <span className="inline-flex items-center gap-1 bg-[var(--pale-sage)] text-[var(--forest-green)] px-2 py-0.5 text-[10px] font-black rounded-full shadow-2xs shrink-0">
                        <Check className="h-3 w-3 stroke-[2.5]" />
                        <span>Active</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-[var(--text-muted)] group-hover:text-[var(--forest-green)]">
                        Select
                      </span>
                    )}
                  </div>

                  {theme.tagline && (
                    <div className="text-[11px] font-semibold text-[var(--forest-green)]">
                      {theme.tagline}
                    </div>
                  )}

                  <p className="text-xs text-[var(--text-muted)] line-clamp-2 leading-relaxed pt-0.5">
                    {theme.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Google Authentication Section */}
      <div className="paper-card p-6 space-y-5 border border-[var(--border-default)]">
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--surface-secondary)] text-[var(--text-heading)] border border-[var(--border-default)]">
            <Globe className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[var(--text-heading)]">Google OAuth 2.0 Login</h2>
            <p className="text-xs text-[var(--text-muted)]">Sign in with your Google account to sync your personal learning data</p>
          </div>
        </div>

        {activeUser && jwtToken ? (
          <div className="paper-card bg-[var(--surface-secondary)] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-[var(--border-default)]">
            <div className="flex items-center space-x-4">
              {activeUser.avatarUrl ? (
                <img src={activeUser.avatarUrl} alt={activeUser.name} className="h-12 w-12 rounded-full border border-[var(--border-default)]" />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--forest-green)] text-lg font-bold text-white">
                  {activeUser.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <div className="font-bold text-[var(--text-heading)] text-base">{activeUser.name}</div>
                <div className="text-xs text-[var(--text-muted)]">{activeUser.email}</div>
                <span className="inline-block bg-[var(--pale-sage)] px-2.5 py-0.5 text-[10px] font-bold text-[var(--forest-green)] rounded mt-1">
                  Google Account Connected
                </span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="paper-btn-secondary px-4 py-2 text-xs font-bold text-red-600 border-red-200 hover:bg-red-50"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <div className="paper-card bg-[var(--surface-secondary)] p-6 space-y-4 border border-[var(--border-default)]">
            <p className="text-xs text-[var(--text-muted)]">
              Authenticate securely with Google. Your user account and learning data will be bound to your verified Google email.
            </p>

            <button
              onClick={handleGoogleLogin}
              disabled={loadingGoogle}
              className="paper-btn-secondary px-6 py-2.5 font-bold text-xs flex items-center justify-center space-x-3 rounded-lg border border-[var(--border-default)] cursor-pointer hover:bg-[var(--surface-primary)]"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
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
              <span>{loadingGoogle ? "Connecting to Google..." : "Sign in with Google"}</span>
            </button>
          </div>
        )}
      </div>

    </div>
  );
};
