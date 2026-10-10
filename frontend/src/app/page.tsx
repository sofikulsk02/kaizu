"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Api,
  Subject,
  Goal,
  GoalDetail,
  User,
  setJwtToken,
  setActiveUserId,
  clearAuth,
  isAuthenticated,
} from "../lib/api";
import { getActiveThemeId, applyTheme } from "../lib/theme";
import { Navbar } from "../components/Navbar";
import { Sidebar } from "../components/Sidebar";
import { DashboardView } from "../components/DashboardView";
import { SubjectsView } from "../components/SubjectsView";
import { SubjectDetailView } from "../components/SubjectDetailView";
import { GoalsView } from "../components/GoalsView";
import { GoalDetailView } from "../components/GoalDetailView";
import { ProjectsView } from "../components/ProjectsView";
import { ProjectDetailView } from "../components/ProjectDetailView";
import { ActivityView } from "../components/ActivityView";
import { SettingsView } from "../components/SettingsView";
import { CreateSubjectModal } from "../components/CreateSubjectModal";
import { CreateGoalModal } from "../components/CreateGoalModal";
import { QuickCaptureModal } from "../components/QuickCaptureModal";
import { LoginScreen } from "../components/LoginScreen";
import { MichiAssistant } from "../components/assistant";

export default function Page() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeUser, setActiveUser] = useState<User | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedGoalDetail, setSelectedGoalDetail] = useState<GoalDetail | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [previousView, setPreviousView] = useState<{
    tab: string;
    selectedSubject: Subject | null;
    selectedGoalDetail: GoalDetail | null;
    selectedProjectId: string | null;
  } | null>(null);

  const [showCreateSubject, setShowCreateSubject] = useState(false);
  const [showCreateGoal, setShowCreateGoal] = useState(false);
  const [showQuickCapture, setShowQuickCapture] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Synchronization refs to eliminate stale closure overwrites
  const selectedSubjectRef = useRef<Subject | null>(null);
  const selectedGoalDetailRef = useRef<GoalDetail | null>(null);
  const activeTabRef = useRef<string>(activeTab);

  useEffect(() => {
    selectedSubjectRef.current = selectedSubject;
  }, [selectedSubject]);

  useEffect(() => {
    selectedGoalDetailRef.current = selectedGoalDetail;
  }, [selectedGoalDetail]);

  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  // 1. Instant Client Hydration: Load cached state immediately (0ms start on mobile)
  useEffect(() => {
    try {
      const cachedUser = localStorage.getItem("kaizu_cached_user");
      const cachedSubs = localStorage.getItem("kaizu_cached_subjects");
      const cachedGoals = localStorage.getItem("kaizu_cached_goals");

      if (cachedUser) {
        setActiveUser(JSON.parse(cachedUser));
        if (cachedSubs) setSubjects(JSON.parse(cachedSubs));
        if (cachedGoals) setGoals(JSON.parse(cachedGoals));
        // Unblock UI immediately so user sees their dashboard in 0ms!
        setLoading(false);
      }
    } catch (e) {
      // Ignore cache parse errors
    }
  }, []);

  const refreshCurrentSubject = useCallback(async () => {
    if (!selectedSubjectRef.current) return;
    try {
      const updated = await Api.getSubjectById(selectedSubjectRef.current.id);
      setSelectedSubject(updated);
      Api.getSubjects().then((subs) => setSubjects(subs)).catch(() => {});
    } catch (e) {}
  }, []);

  const refreshCurrentGoal = useCallback(async () => {
    if (!selectedGoalDetailRef.current) return;
    try {
      const updated = await Api.getGoalById(selectedGoalDetailRef.current.id);
      setSelectedGoalDetail(updated);
      Api.getGoals().then((gls) => setGoals(gls)).catch(() => {});
    } catch (e) {}
  }, []);

  const fetchData = useCallback(async () => {
    if (!activeUser && !localStorage.getItem("kaizu_cached_user")) {
      setLoading(true);
    }
    setError(null);
    try {
      // Parallelize profile, subjects, and goals into 1 single roundtrip
      const [user, subs, gls] = await Promise.all([
        Api.getMe(),
        Api.getSubjects(),
        Api.getGoals(),
      ]);

      setActiveUser(user);
      setSubjects(subs);
      setGoals(gls);

      // Save fresh data to client cache for next instant startup
      try {
        localStorage.setItem("kaizu_cached_user", JSON.stringify(user));
        localStorage.setItem("kaizu_cached_subjects", JSON.stringify(subs));
        localStorage.setItem("kaizu_cached_goals", JSON.stringify(gls));
      } catch (e) {}

      // Refresh currently open subject if still viewing it
      if (activeTabRef.current === "subjects" && selectedSubjectRef.current) {
        try {
          const updatedSubject = await Api.getSubjectById(selectedSubjectRef.current.id);
          if (activeTabRef.current === "subjects" && selectedSubjectRef.current?.id === updatedSubject.id) {
            setSelectedSubject(updatedSubject);
          }
        } catch (e) {}
      }

      // Refresh currently open goal if still viewing it
      if (activeTabRef.current === "goals" && selectedGoalDetailRef.current) {
        try {
          const updatedGoalDetail = await Api.getGoalById(selectedGoalDetailRef.current.id);
          if (activeTabRef.current === "goals" && selectedGoalDetailRef.current?.id === updatedGoalDetail.id) {
            setSelectedGoalDetail(updatedGoalDetail);
          }
        } catch (e) {}
      }
    } catch (err: any) {
      console.error("Authentication required or failed:", err);
      if (err.message?.includes("Authentication required") || err.message?.includes("Invalid or expired")) {
        clearAuth();
        try {
          localStorage.removeItem("kaizu_cached_user");
          localStorage.removeItem("kaizu_cached_subjects");
          localStorage.removeItem("kaizu_cached_goals");
        } catch (e) {}
        setActiveUser(null);
      } else {
        setError(err.message || "Failed to sync with cloud server. Server may be spinning up.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initialize Theme from localStorage
    applyTheme(getActiveThemeId());

    // Default sidebar open on desktop, closed on mobile
    if (typeof window !== "undefined" && window.innerWidth >= 768) {
      setIsSidebarOpen(true);
    }

    // Process OAuth callback tokens from URL if returned from Google Login
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const token = params.get("token");
      const userId = params.get("userId");

      if (token && userId) {
        setJwtToken(token);
        setActiveUserId(userId);
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }

    if (isAuthenticated()) {
      fetchData();
    } else {
      setLoading(false);
      setActiveUser(null);
    }
  }, [fetchData]);

  // Auto-close sidebar when resizing to mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleSelectSubject = async (subject: Subject) => {
    try {
      const detail = await Api.getSubjectById(subject.id);
      setSelectedSubject(detail);
      setSelectedGoalDetail(null);
      setSelectedProjectId(null);
      setActiveTab("subjects");
    } catch (err: any) {
      alert(err.message || "Failed to load subject details");
    }
  };

  const handleSelectGoal = async (goal: Goal) => {
    try {
      const detail = await Api.getGoalById(goal.id);
      setSelectedGoalDetail(detail);
      setSelectedSubject(null);
      setSelectedProjectId(null);
      setActiveTab("goals");
    } catch (err: any) {
      alert(err.message || "Failed to load goal workspace");
    }
  };

  const handleUserChanged = () => {
    setSelectedSubject(null);
    setSelectedGoalDetail(null);
    setSelectedProjectId(null);
    fetchData();
  };

  const resetSelection = () => {
    setSelectedSubject(null);
    setSelectedGoalDetail(null);
    setSelectedProjectId(null);
  };

  const handleSelectTab = (tab: string) => {
    resetSelection();
    setActiveTab(tab);
    if (tab !== "settings") {
      setPreviousView(null);
    }
  };

  const isSettingsOpen =
    activeTab === "settings" &&
    !selectedSubject &&
    !selectedGoalDetail &&
    !selectedProjectId;

  const handleToggleSettings = () => {
    if (isSettingsOpen) {
      // Toggle back to earlier view
      if (previousView) {
        setActiveTab(previousView.tab);
        setSelectedSubject(previousView.selectedSubject);
        setSelectedGoalDetail(previousView.selectedGoalDetail);
        setSelectedProjectId(previousView.selectedProjectId);
        setPreviousView(null);
      } else {
        handleSelectTab("dashboard");
      }
    } else {
      // Save snapshot of earlier view and open settings
      setPreviousView({
        tab: activeTab,
        selectedSubject,
        selectedGoalDetail,
        selectedProjectId,
      });
      resetSelection();
      setActiveTab("settings");
    }
  };

  // If initial auth check is running
  if (loading && !activeUser) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center bg-[var(--bg-main)]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--forest-green)] border-t-transparent mb-4"></div>
        <span className="font-bold text-sm text-[var(--text-heading)]">Connecting to Kaizu Cloud OS...</span>
        <span className="text-xs text-[var(--text-muted)] mt-1.5 max-w-xs">
          Waking up cloud server. (Render free tier cold starts may take ~30–45 seconds if inactive).
        </span>
      </div>
    );
  }

  // Mandatory Authentication Gate: Unauthenticated users MUST see LoginScreen
  if (!activeUser) {
    return <LoginScreen onLoginSuccess={fetchData} />;
  }

  return (
    <div className="flex min-h-screen flex-col font-sans antialiased">
      {/* Top Navigation */}
      <Navbar
        activeUser={activeUser}
        isSidebarOpen={isSidebarOpen}
        isSettingsOpen={isSettingsOpen}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        onOpenQuickAdd={() => setShowQuickCapture(true)}
        onToggleSettings={handleToggleSettings}
        onSelectTab={handleSelectTab}
      />

      {/* Main Container */}
      <div className="flex flex-1 pt-14 sm:pt-16">
        {/* Sidebar Navigation */}
        <Sidebar
          isOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
          activeTab={activeTab}
          onSelectTab={handleSelectTab}
          counts={{
            subjects: subjects.length,
            goals: goals.length,
          }}
        />

        {/* Content Area */}
        <main className={`flex-1 px-2 pt-3.5 pb-3 sm:px-3 sm:pt-4 sm:pb-4 lg:p-3.5 max-w-7xl mx-auto w-full min-w-0 transition-all duration-300 ${isSidebarOpen ? "md:ml-60" : "ml-0"}`}>
          {error && (
            <div className="mb-6 rounded-2xl border border-red-400/30 bg-red-500/15 p-4 text-sm text-red-200 flex items-center justify-between">
              <span>{error}</span>
              <button
                onClick={fetchData}
                className="ml-4 rounded-lg bg-red-500/20 px-3 py-1 text-xs font-semibold text-white hover:bg-red-500/30"
              >
                Retry
              </button>
            </div>
          )}

          {/* Active Tab View Routing */}
          {activeTab === "dashboard" && (
            <DashboardView
              subjects={subjects}
              goals={goals}
              onSelectTab={handleSelectTab}
              onSelectSubject={handleSelectSubject}
              onSelectGoal={handleSelectGoal}
              onOpenCreateSubject={() => setShowCreateSubject(true)}
              onOpenCreateGoal={() => setShowCreateGoal(true)}
            />
          )}

          {activeTab === "subjects" && (
            selectedSubject ? (
              <SubjectDetailView
                subject={selectedSubject}
                onBack={() => setSelectedSubject(null)}
                onRefresh={refreshCurrentSubject}
              />
            ) : (
              <SubjectsView
                subjects={subjects}
                onSelectSubject={handleSelectSubject}
                onOpenCreateSubject={() => setShowCreateSubject(true)}
              />
            )
          )}

          {activeTab === "goals" && (
            selectedGoalDetail ? (
              <GoalDetailView
                goalDetail={selectedGoalDetail}
                onBack={() => setSelectedGoalDetail(null)}
                onRefresh={refreshCurrentGoal}
              />
            ) : (
              <GoalsView
                goals={goals}
                onSelectGoal={handleSelectGoal}
                onOpenCreateGoal={() => setShowCreateGoal(true)}
                onRefresh={fetchData}
              />
            )
          )}

          {activeTab === "projects" && (
            selectedProjectId ? (
              <ProjectDetailView
                projectId={selectedProjectId}
                onBack={() => setSelectedProjectId(null)}
              />
            ) : (
              <ProjectsView
                onSelectProject={(id) => setSelectedProjectId(id)}
              />
            )
          )}

          {activeTab === "activity" && (
            <ActivityView subjects={subjects} goals={goals} />
          )}

          {activeTab === "settings" && (
            <SettingsView onUserChanged={handleUserChanged} />
          )}
        </main>
      </div>

      {/* Modals */}
      <CreateSubjectModal
        isOpen={showCreateSubject}
        onClose={() => setShowCreateSubject(false)}
        onSuccess={fetchData}
      />

      <CreateGoalModal
        isOpen={showCreateGoal}
        onClose={() => setShowCreateGoal(false)}
        onSuccess={fetchData}
      />

      <QuickCaptureModal
        isOpen={showQuickCapture}
        goals={goals}
        onClose={() => setShowQuickCapture(false)}
        onSuccess={fetchData}
      />

      {/* Michi AI Continuous Improvement Companion */}
      <MichiAssistant
        pageContext={
          activeTab === "subjects" && selectedSubject
            ? {
                type: "subject",
                recordId: selectedSubject.id,
                recordName: selectedSubject.name,
              }
            : activeTab === "goals" && selectedGoalDetail
            ? {
                type: "goal",
                recordId: selectedGoalDetail.id,
                recordName: selectedGoalDetail.title,
              }
            : activeTab === "projects" && selectedProjectId
            ? {
                type: "project",
                recordId: selectedProjectId,
              }
            : {
                type: activeTab as any,
              }
        }
      />
    </div>
  );
}
