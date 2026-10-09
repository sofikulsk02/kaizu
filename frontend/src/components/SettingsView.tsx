"use client";

import React, { useState, useEffect } from "react";
import { getActiveUserId, setActiveUserId, clearAuth, getJwtToken, Api, User } from "../lib/api";
import { THEMES, getActiveThemeId, applyTheme } from "../lib/theme";

interface SettingsViewProps {
  onUserChanged: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onUserChanged }) => {
  const currentUserId = getActiveUserId();
  const jwtToken = getJwtToken();

  const [activeUser, setActiveUser] = useState<User | null>(null);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [selectedThemeId, setSelectedThemeId] = useState<string>("wine");

  const [customUserId, setCustomUserId] = useState("");
  const [customUserName, setCustomUserName] = useState("");
  const [customUserEmail, setCustomUserEmail] = useState("");

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

  useEffect(() => {
    setSelectedThemeId(getActiveThemeId());
    Api.getMe()
      .then((u) => setActiveUser(u))
      .catch(() => setActiveUser(null));
  }, [currentUserId, jwtToken]);

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

  const handleSwitchUser = async (userId: string) => {
    setActiveUserId(userId);
    onUserChanged();
  };

  const handleCreateCustomDevUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUserId.trim() || !customUserName.trim() || !customUserEmail.trim()) {
      alert("All fields are required for creating custom dev user");
      return;
    }
    try {
      const res = await Api.createDevUser({
        id: customUserId.trim(),
        name: customUserName.trim(),
        email: customUserEmail.trim(),
      });
      setActiveUserId(res.user.id);
      onUserChanged();
      setCustomUserId("");
      setCustomUserName("");
      setCustomUserEmail("");
    } catch (err: any) {
      alert(err.message || "Failed to create dev user");
    }
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
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--pale-sage)] text-xl text-[var(--forest-green)] font-bold">
            🎨
          </div>
          <div>
            <h2 className="text-lg font-bold text-[var(--text-heading)]">Theme Palette Switcher</h2>
            <p className="text-xs text-[var(--text-muted)]">Select your preferred paper color palette below</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3 pt-2">
          {THEMES.map((theme) => {
            const isSelected = selectedThemeId === theme.id;
            return (
              <div
                key={theme.id}
                onClick={() => handleSelectTheme(theme.id)}
                className={`cursor-pointer rounded-xl p-5 transition flex flex-col justify-between space-y-4 border ${
                  isSelected
                    ? "paper-card border-[var(--forest-green)] ring-2 ring-[var(--forest-green)]/20 scale-[1.01]"
                    : "paper-card bg-[var(--surface-secondary)] border-[var(--border-default)] hover:border-[var(--forest-green)]"
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-[var(--text-heading)]">{theme.name}</span>
                    {isSelected && (
                      <span className="bg-[var(--pale-sage)] text-[var(--forest-green)] px-2.5 py-0.5 text-[10px] font-extrabold rounded">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--text-muted)] line-clamp-2 leading-relaxed">
                    {theme.description}
                  </p>
                </div>

                {/* Color Swatch Circle Plate */}
                <div className="pt-2 border-t border-[var(--border-default)] space-y-2">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    Color Swatch Palette
                  </div>
                  <div className="flex items-center space-x-3">
                    {theme.colors.map((color, idx) => (
                      <div key={idx} className="group relative flex flex-col items-center">
                        <div
                          className="h-8 w-8 rounded-full border border-[var(--border-default)] shadow-xs transition-transform group-hover:scale-110"
                          style={{ backgroundColor: color }}
                        />
                        <span className="mt-1 text-[9px] font-semibold text-[var(--text-muted)] max-w-[60px] truncate text-center">
                          {theme.labels[idx]}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Google Authentication Section */}
      <div className="paper-card p-6 space-y-5 border border-[var(--border-default)]">
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--surface-secondary)] text-xl border border-[var(--border-default)]">
            🌐
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
              Sign Out / Clear Token
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

      {/* Cross-User Security Testing & Identity Switcher */}
      <div className="paper-card p-6 space-y-4 border border-[var(--border-default)]">
        <div className="flex items-center space-x-2">
          <span className="text-xl">🔒</span>
          <h2 className="text-lg font-bold text-[var(--text-heading)]">Dev Security & Multi-User Switcher</h2>
        </div>
        <p className="text-xs text-[var(--text-muted)]">
          Kaizu enforces strict server-side ownership. Switch users below to verify that User A cannot see, edit, or delete User B's subjects, chapters, topics, or goals.
        </p>

        <div className="grid gap-3 sm:grid-cols-3 pt-2">
          {presetUsers.map((user) => {
            const isSelected = currentUserId === user.id;
            return (
              <div
                key={user.id}
                onClick={() => handleSwitchUser(user.id)}
                className={`cursor-pointer rounded-xl border p-4 transition ${
                  isSelected
                    ? "paper-btn-primary border-transparent"
                    : "paper-card bg-[var(--surface-secondary)] border-[var(--border-default)] hover:border-[var(--forest-green)]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold ${isSelected ? "text-white" : "text-[var(--text-heading)]"}`}>{user.name}</span>
                  {isSelected && <span className="bg-white/20 px-2 py-0.5 text-[10px] font-bold text-white rounded">ACTIVE</span>}
                </div>
                <div className={`text-xs mt-1 ${isSelected ? "text-white/80" : "text-[var(--text-muted)]"}`}>{user.email}</div>
                <div className={`text-[10px] font-mono mt-2 truncate ${isSelected ? "text-white/70" : "text-[var(--text-muted)]"}`}>
                  ID: {user.id}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Provision Custom Dev User */}
      <div className="paper-card p-6 space-y-4 border border-[var(--border-default)]">
        <h2 className="text-lg font-bold text-[var(--text-heading)]">Provision Test User</h2>
        <form onSubmit={handleCreateCustomDevUser} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-bold text-[var(--text-muted)]">User UUID</label>
              <input
                type="text"
                placeholder="33333333-3333-3333-3333-333333333333"
                value={customUserId}
                onChange={(e) => setCustomUserId(e.target.value)}
                className="paper-input mt-1.5 w-full px-3.5 py-2 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--text-muted)]">Name</label>
              <input
                type="text"
                placeholder="User C (Tester)"
                value={customUserName}
                onChange={(e) => setCustomUserName(e.target.value)}
                className="paper-input mt-1.5 w-full px-3.5 py-2 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--text-muted)]">Email</label>
              <input
                type="email"
                placeholder="userc@kaizu.app"
                value={customUserEmail}
                onChange={(e) => setCustomUserEmail(e.target.value)}
                className="paper-input mt-1.5 w-full px-3.5 py-2 text-xs"
              />
            </div>
          </div>
          <button
            type="submit"
            className="paper-btn-primary px-5 py-2.5 text-xs font-bold"
          >
            Provision & Switch User
          </button>
        </form>
      </div>
    </div>
  );
};
