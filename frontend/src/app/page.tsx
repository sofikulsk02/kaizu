"use client";

import React, { useState, useEffect, useCallback } from "react";
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

export default function Page() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeUser, setActiveUser] = useState<User | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedGoalDetail, setSelectedGoalDetail] = useState<GoalDetail | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const [showCreateSubject, setShowCreateSubject] = useState(false);
  const [showCreateGoal, setShowCreateGoal] = useState(false);
  const [showQuickCapture, setShowQuickCapture] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const user = await Api.getMe();
      setActiveUser(user);

      const [subs, gls] = await Promise.all([
        Api.getSubjects(),
        Api.getGoals(),
      ]);

      setSubjects(subs);
      setGoals(gls);

      // Refresh selected subject if open
      if (selectedSubject) {
        try {
          const updatedSubject = await Api.getSubjectById(selectedSubject.id);
          setSelectedSubject(updatedSubject);
        } catch (e) {
          setSelectedSubject(null);
        }
      }

      // Refresh selected goal detail if open
      if (selectedGoalDetail) {
        try {
          const updatedGoalDetail = await Api.getGoalById(selectedGoalDetail.id);
          setSelectedGoalDetail(updatedGoalDetail);
        } catch (e) {
          setSelectedGoalDetail(null);
        }
      }
    } catch (err: any) {
      console.error("Authentication required or failed:", err);
      clearAuth();
      setActiveUser(null);
    } finally {
      setLoading(false);
    }
  }, [selectedSubject?.id, selectedGoalDetail?.id]);

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

  // If initial auth check is running
  if (loading && !activeUser) {
    return (
      <div className="flex min-h-screen items-center justify-center space-x-2 text-sm">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
        <span className="font-semibold">Connecting to Kaizu OS...</span>
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
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        onOpenQuickAdd={() => setShowQuickCapture(true)}
        onSelectTab={(tab) => {
          resetSelection();
          setActiveTab(tab);
        }}
      />

      {/* Main Container */}
      <div className="flex flex-1 pt-14 sm:pt-16">
        {/* Sidebar Navigation */}
        <Sidebar
          isOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
          activeTab={activeTab}
          onSelectTab={(tab) => {
            resetSelection();
            setActiveTab(tab);
          }}
          counts={{
            subjects: subjects.length,
            goals: goals.length,
          }}
        />

        {/* Content Area */}
        <main className={`flex-1 p-3 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full min-w-0 transition-all duration-300 ${isSidebarOpen ? "md:ml-60" : "ml-0"}`}>
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

          {selectedSubject ? (
            <SubjectDetailView
              subject={selectedSubject}
              onBack={() => setSelectedSubject(null)}
              onRefresh={fetchData}
            />
          ) : selectedGoalDetail ? (
            <GoalDetailView
              goalDetail={selectedGoalDetail}
              onBack={() => setSelectedGoalDetail(null)}
              onRefresh={fetchData}
            />
          ) : selectedProjectId ? (
            <ProjectDetailView
              projectId={selectedProjectId}
              onBack={() => setSelectedProjectId(null)}
            />
          ) : (
            <>
              {activeTab === "dashboard" && (
                <DashboardView
                  subjects={subjects}
                  goals={goals}
                  onSelectTab={(tab) => {
                    resetSelection();
                    setActiveTab(tab);
                  }}
                  onSelectSubject={handleSelectSubject}
                  onSelectGoal={handleSelectGoal}
                  onOpenCreateSubject={() => setShowCreateSubject(true)}
                  onOpenCreateGoal={() => setShowCreateGoal(true)}
                />
              )}

              {activeTab === "subjects" && (
                <SubjectsView
                  subjects={subjects}
                  onSelectSubject={handleSelectSubject}
                  onOpenCreateSubject={() => setShowCreateSubject(true)}
                />
              )}

              {activeTab === "goals" && (
                <GoalsView
                  goals={goals}
                  onSelectGoal={handleSelectGoal}
                  onOpenCreateGoal={() => setShowCreateGoal(true)}
                  onRefresh={fetchData}
                />
              )}

              {activeTab === "projects" && (
                <ProjectsView
                  onSelectProject={(id) => setSelectedProjectId(id)}
                />
              )}

              {activeTab === "activity" && (
                <ActivityView subjects={subjects} goals={goals} />
              )}

              {activeTab === "settings" && (
                <SettingsView onUserChanged={handleUserChanged} />
              )}
            </>
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
    </div>
  );
}
