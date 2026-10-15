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
  getActiveUserId,
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
import { KaizuLoader } from "../components/KaizuLoader";

const VALID_TABS = ["dashboard", "subjects", "goals", "projects", "activity", "settings"];

function buildUrl(
  tab: string,
  subjectId?: string | null,
  goalId?: string | null,
  projectId?: string | null
): string {
  if (tab === "dashboard" && !subjectId && !goalId && !projectId) {
    return "/";
  }
  const params = new URLSearchParams();
  if (tab && tab !== "dashboard") params.set("tab", tab);
  if (subjectId) params.set("subjectId", subjectId);
  if (goalId) params.set("goalId", goalId);
  if (projectId) params.set("projectId", projectId);

  const qs = params.toString();
  return qs ? `/?${qs}` : "/";
}

function persistNav(
  tab: string,
  subjectId?: string | null,
  goalId?: string | null,
  projectId?: string | null
) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      "kaizu_last_view",
      JSON.stringify({
        tab,
        subjectId: subjectId || null,
        goalId: goalId || null,
        projectId: projectId || null,
      })
    );
  } catch (e) {}
}

function getInitialNav(): {
  tab: string;
  subjectId: string | null;
  goalId: string | null;
  projectId: string | null;
} {
  if (typeof window === "undefined") {
    return { tab: "dashboard", subjectId: null, goalId: null, projectId: null };
  }

  // 1. URL search params take highest priority on reload
  const params = new URLSearchParams(window.location.search);
  const tabFromUrl = params.get("tab");
  const subjectIdFromUrl = params.get("subjectId");
  const goalIdFromUrl = params.get("goalId");
  const projectIdFromUrl = params.get("projectId");

  if (tabFromUrl && VALID_TABS.includes(tabFromUrl)) {
    return {
      tab: tabFromUrl,
      subjectId: subjectIdFromUrl || null,
      goalId: goalIdFromUrl || null,
      projectId: projectIdFromUrl || null,
    };
  }

  // 2. Fallback to localStorage for PWA resume
  try {
    const saved = localStorage.getItem("kaizu_last_view");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.tab && VALID_TABS.includes(parsed.tab)) {
        return {
          tab: parsed.tab,
          subjectId: parsed.subjectId || null,
          goalId: parsed.goalId || null,
          projectId: parsed.projectId || null,
        };
      }
    }
  } catch (e) {}

  return { tab: "dashboard", subjectId: null, goalId: null, projectId: null };
}

interface NavHistoryState {
  tab?: string;
  subjectId?: string | null;
  goalId?: string | null;
  projectId?: string | null;
  modal?: "subject" | "goal" | "quickCapture" | null;
  drawer?: string | null;
  isSettings?: boolean;
  depth?: number;
}

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
  const [loadingSubjectId, setLoadingSubjectId] = useState<string | null>(null);
  const [loadingGoalId, setLoadingGoalId] = useState<string | null>(null);
  const [loadingProjectId, setLoadingProjectId] = useState<string | null>(null);

  // Synchronization refs to eliminate stale closure overwrites
  const selectedSubjectRef = useRef<Subject | null>(null);
  const selectedGoalDetailRef = useRef<GoalDetail | null>(null);
  const selectedProjectIdRef = useRef<string | null>(null);
  const activeTabRef = useRef<string>(activeTab);
  const showCreateSubjectRef = useRef<boolean>(showCreateSubject);
  const showCreateGoalRef = useRef<boolean>(showCreateGoal);
  const showQuickCaptureRef = useRef<boolean>(showQuickCapture);
  const isSidebarOpenRef = useRef<boolean>(isSidebarOpen);
  const currentDepthRef = useRef<number>(0);

  useEffect(() => {
    selectedSubjectRef.current = selectedSubject;
  }, [selectedSubject]);

  useEffect(() => {
    selectedGoalDetailRef.current = selectedGoalDetail;
  }, [selectedGoalDetail]);

  useEffect(() => {
    selectedProjectIdRef.current = selectedProjectId;
  }, [selectedProjectId]);

  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  useEffect(() => {
    showCreateSubjectRef.current = showCreateSubject;
  }, [showCreateSubject]);

  useEffect(() => {
    showCreateGoalRef.current = showCreateGoal;
  }, [showCreateGoal]);

  useEffect(() => {
    showQuickCaptureRef.current = showQuickCapture;
  }, [showQuickCapture]);

  useEffect(() => {
    isSidebarOpenRef.current = isSidebarOpen;
  }, [isSidebarOpen]);

  // 1. Instant Client Hydration: Load cached state & restore exact active page on refresh (0ms start)
  useEffect(() => {
    try {
      const currentUserId = getActiveUserId();
      const cachedUser = localStorage.getItem("kaizu_cached_user");
      const parsedUser = cachedUser ? JSON.parse(cachedUser) : null;

      const initial = getInitialNav();
      if (initial.tab) {
        setActiveTab(initial.tab);
        activeTabRef.current = initial.tab;
      }

      // Only hydrate cache if it belongs to the currently active user session!
      if (parsedUser && currentUserId && parsedUser.id === currentUserId) {
        setActiveUser(parsedUser);
        const cachedSubs = localStorage.getItem(`kaizu_cached_subjects_${parsedUser.id}`) || localStorage.getItem("kaizu_cached_subjects");
        const cachedGoals = localStorage.getItem(`kaizu_cached_goals_${parsedUser.id}`) || localStorage.getItem("kaizu_cached_goals");

        let parsedSubs: Subject[] = [];
        if (cachedSubs) {
          parsedSubs = JSON.parse(cachedSubs);
          setSubjects(parsedSubs);
        }

        if (cachedGoals) {
          setGoals(JSON.parse(cachedGoals));
        }

        if (initial.subjectId && parsedSubs.length > 0) {
          const found = parsedSubs.find((s) => s.id === initial.subjectId);
          if (found) {
            setSelectedSubject(found);
            selectedSubjectRef.current = found;
          }
        }

        if (initial.projectId) {
          setSelectedProjectId(initial.projectId);
          selectedProjectIdRef.current = initial.projectId;
        }

        setLoading(false);
      } else {
        // Different user or no user authenticated
        if (!currentUserId) {
          setActiveUser(null);
          setSubjects([]);
          setGoals([]);
        }
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

      if (user?.id) {
        setActiveUserId(user.id);
      }
      setActiveUser(user);
      setSubjects(subs);
      setGoals(gls);

      // Safe Account-Based Migration:
      // If legacy unscoped activity records exist and have not yet been assigned to an owner,
      // only the primary account with history (Account 1 with subjects/goals) claims it!
      try {
        const legacyActivity = localStorage.getItem("kaizu_activity_records");
        const legacyOwner = localStorage.getItem("kaizu_legacy_activity_owner");
        if (legacyActivity && !legacyOwner && user?.id) {
          if (subs.length > 0 || gls.length > 0) {
            localStorage.setItem("kaizu_legacy_activity_owner", user.id);
            localStorage.setItem(`kaizu_activity_records_${user.id}`, legacyActivity);
            const legacyReflections = localStorage.getItem("kaizu_daily_reflections");
            if (legacyReflections) {
              localStorage.setItem(`kaizu_daily_reflections_${user.id}`, legacyReflections);
            }
            localStorage.removeItem("kaizu_activity_records");
            localStorage.removeItem("kaizu_daily_reflections");
          }
        }
      } catch (e) {}

      // Save fresh data to user-scoped client cache
      try {
        localStorage.setItem("kaizu_cached_user", JSON.stringify(user));
        if (user?.id) {
          localStorage.setItem(`kaizu_cached_subjects_${user.id}`, JSON.stringify(subs));
          localStorage.setItem(`kaizu_cached_goals_${user.id}`, JSON.stringify(gls));
        }
      } catch (e) {}

      // Refresh or load subject if currently viewing or restored from URL on refresh
      const initial = getInitialNav();
      const currentSubId = selectedSubjectRef.current?.id || (activeTabRef.current === "subjects" ? initial.subjectId : null);
      if (activeTabRef.current === "subjects" && currentSubId) {
        try {
          const updatedSubject = await Api.getSubjectById(currentSubId);
          if (activeTabRef.current === "subjects") {
            setSelectedSubject(updatedSubject);
            selectedSubjectRef.current = updatedSubject;
          }
        } catch (e) {}
      }

      // Refresh or load goal if currently viewing or restored from URL on refresh
      const currentGoalId = selectedGoalDetailRef.current?.id || (activeTabRef.current === "goals" ? initial.goalId : null);
      if (activeTabRef.current === "goals" && currentGoalId) {
        try {
          const updatedGoalDetail = await Api.getGoalById(currentGoalId);
          if (activeTabRef.current === "goals") {
            setSelectedGoalDetail(updatedGoalDetail);
            selectedGoalDetailRef.current = updatedGoalDetail;
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
        params.delete("token");
        params.delete("userId");
        const remainingQuery = params.toString();
        const cleanUrl = remainingQuery ? `${window.location.pathname}?${remainingQuery}` : window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
      }
    }

    if (isAuthenticated()) {
      fetchData();
    } else {
      setLoading(false);
      setActiveUser(null);
    }
  }, [fetchData]);

  // Push new navigation step into history stack
  const pushNav = (entry: Partial<NavHistoryState>) => {
    if (typeof window === "undefined") return;
    const nextDepth = (currentDepthRef.current || 0) + 1;
    currentDepthRef.current = nextDepth;
    const tab = entry.tab ?? activeTabRef.current;
    const subjectId = entry.subjectId !== undefined ? entry.subjectId : selectedSubjectRef.current?.id || null;
    const goalId = entry.goalId !== undefined ? entry.goalId : selectedGoalDetailRef.current?.id || null;
    const projectId = entry.projectId !== undefined ? entry.projectId : selectedProjectIdRef.current;
    const newState: NavHistoryState = {
      tab,
      subjectId,
      goalId,
      projectId,
      modal: entry.modal ?? null,
      drawer: entry.drawer ?? null,
      isSettings: entry.isSettings ?? false,
      depth: nextDepth,
    };
    const url = buildUrl(tab, subjectId, goalId, projectId);
    window.history.pushState(newState, "", url);
    persistNav(tab, subjectId, goalId, projectId);
  };

  const replaceNav = (entry: Partial<NavHistoryState>) => {
    if (typeof window === "undefined") return;
    const tab = entry.tab ?? activeTabRef.current;
    const subjectId = entry.subjectId !== undefined ? entry.subjectId : selectedSubjectRef.current?.id || null;
    const goalId = entry.goalId !== undefined ? entry.goalId : selectedGoalDetailRef.current?.id || null;
    const projectId = entry.projectId !== undefined ? entry.projectId : selectedProjectIdRef.current;
    const newState: NavHistoryState = {
      tab,
      subjectId,
      goalId,
      projectId,
      modal: entry.modal ?? null,
      drawer: entry.drawer ?? null,
      isSettings: entry.isSettings ?? false,
      depth: currentDepthRef.current || 0,
    };
    const url = buildUrl(tab, subjectId, goalId, projectId);
    window.history.replaceState(newState, "", url);
    persistNav(tab, subjectId, goalId, projectId);
  };

  // Dedicated handlers to return cleanly to section listings (Subjects, Goals, Projects)
  const handleBackFromSubject = () => {
    setSelectedSubject(null);
    selectedSubjectRef.current = null;
    setActiveTab("subjects");
    replaceNav({ tab: "subjects", subjectId: null, goalId: null, projectId: null });
  };

  const handleBackFromGoal = () => {
    setSelectedGoalDetail(null);
    selectedGoalDetailRef.current = null;
    setActiveTab("goals");
    replaceNav({ tab: "goals", goalId: null, subjectId: null, projectId: null });
  };

  const handleBackFromProject = () => {
    setSelectedProjectId(null);
    selectedProjectIdRef.current = null;
    setActiveTab("projects");
    replaceNav({ tab: "projects", projectId: null, subjectId: null, goalId: null });
  };

  // Unified in-app Back handler (used for settings and general fallback)
  const handleBack = () => {
    if (activeTabRef.current === "settings" && previousView) {
      setActiveTab(previousView.tab);
      setSelectedSubject(previousView.selectedSubject);
      setSelectedGoalDetail(previousView.selectedGoalDetail);
      setSelectedProjectId(previousView.selectedProjectId);
      replaceNav({
        tab: previousView.tab,
        subjectId: previousView.selectedSubject?.id || null,
        goalId: previousView.selectedGoalDetail?.id || null,
        projectId: previousView.selectedProjectId || null,
        isSettings: false,
      });
      setPreviousView(null);
    } else if (selectedSubjectRef.current) {
      handleBackFromSubject();
    } else if (selectedGoalDetailRef.current) {
      handleBackFromGoal();
    } else if (selectedProjectIdRef.current) {
      handleBackFromProject();
    } else if (activeTabRef.current !== "dashboard") {
      setActiveTab("dashboard");
      replaceNav({ tab: "dashboard", subjectId: null, goalId: null, projectId: null });
    }
  };

  const handleOpenModal = (modal: "subject" | "goal" | "quickCapture") => {
    if (modal === "subject") setShowCreateSubject(true);
    if (modal === "goal") setShowCreateGoal(true);
    if (modal === "quickCapture") setShowQuickCapture(true);
  };

  const handleCloseModal = () => {
    setShowCreateSubject(false);
    setShowCreateGoal(false);
    setShowQuickCapture(false);
  };

  const handleToggleSidebar = () => {
    setIsSidebarOpen((prev) => {
      const next = !prev;
      if (next && typeof window !== "undefined" && window.innerWidth < 768) {
        pushNav({ drawer: "sidebar" });
      } else if (!next && typeof window !== "undefined" && window.history.state?.drawer === "sidebar") {
        window.history.back();
      }
      return next;
    });
  };

  // PWA Hardware/Gesture Back Button Interception (prevents app from closing on mobile)
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Ensure root entry starts with the actual current state instead of forcing dashboard
    const initial = getInitialNav();
    const initialUrl = buildUrl(initial.tab, initial.subjectId, initial.goalId, initial.projectId);
    window.history.replaceState(
      {
        tab: initial.tab,
        subjectId: initial.subjectId,
        goalId: initial.goalId,
        projectId: initial.projectId,
        depth: 0,
      },
      "",
      initialUrl
    );
    currentDepthRef.current = 0;
    persistNav(initial.tab, initial.subjectId, initial.goalId, initial.projectId);

    const handlePopState = (event: PopStateEvent) => {
      const state = event.state as NavHistoryState | null;
      currentDepthRef.current = state?.depth ?? Math.max(0, currentDepthRef.current - 1);

      // 1. If any modal was open, close it without closing the app
      if (showQuickCaptureRef.current) {
        setShowQuickCapture(false);
        return;
      }
      if (showCreateSubjectRef.current) {
        setShowCreateSubject(false);
        return;
      }
      if (showCreateGoalRef.current) {
        setShowCreateGoal(false);
        return;
      }

      // 2. If mobile sidebar drawer was open, close it
      if (isSidebarOpenRef.current && window.innerWidth < 768) {
        setIsSidebarOpen(false);
        return;
      }

      // 3. If popped to a valid history state:
      if (state) {
        if (state.tab && state.tab !== activeTabRef.current) {
          setActiveTab(state.tab);
        }

        if (state.subjectId) {
          if (selectedSubjectRef.current?.id !== state.subjectId) {
            Api.getSubjectById(state.subjectId).then(setSelectedSubject).catch(() => {});
          }
        } else if (selectedSubjectRef.current) {
          setSelectedSubject(null);
        }

        if (state.goalId) {
          if (selectedGoalDetailRef.current?.id !== state.goalId) {
            Api.getGoalById(state.goalId).then(setSelectedGoalDetail).catch(() => {});
          }
        } else if (selectedGoalDetailRef.current) {
          setSelectedGoalDetail(null);
        }

        if (state.projectId) {
          setSelectedProjectId(state.projectId);
        } else if (selectedProjectIdRef.current) {
          setSelectedProjectId(null);
        }

        if (!state.isSettings && activeTabRef.current === "settings") {
          setPreviousView(null);
        }

        persistNav(state.tab || "dashboard", state.subjectId, state.goalId, state.projectId);
        return;
      }

      // 4. Fallback if popped to root without state:
      const initialFromUrl = getInitialNav();
      setActiveTab(initialFromUrl.tab);
      setSelectedSubject(null);
      setSelectedGoalDetail(null);
      setSelectedProjectId(null);
      persistNav(initialFromUrl.tab, null, null, null);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

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
    setLoadingSubjectId(subject.id);
    try {
      const detail = await Api.getSubjectById(subject.id);
      setSelectedSubject(detail);
      setSelectedGoalDetail(null);
      setSelectedProjectId(null);
      setActiveTab("subjects");
      pushNav({ tab: "subjects", subjectId: detail.id, goalId: null, projectId: null });
    } catch (err: any) {
      alert(err.message || "Failed to load subject details");
    } finally {
      setLoadingSubjectId(null);
    }
  };

  const handleSelectGoal = async (goal: Goal) => {
    setLoadingGoalId(goal.id);
    try {
      const detail = await Api.getGoalById(goal.id);
      setSelectedGoalDetail(detail);
      setSelectedSubject(null);
      setSelectedProjectId(null);
      setActiveTab("goals");
      pushNav({ tab: "goals", goalId: detail.id, subjectId: null, projectId: null });
    } catch (err: any) {
      alert(err.message || "Failed to load goal workspace");
    } finally {
      setLoadingGoalId(null);
    }
  };

  const handleSelectProject = (projectId: string) => {
    setLoadingProjectId(projectId);
    setSelectedProjectId(projectId);
    setSelectedSubject(null);
    setSelectedGoalDetail(null);
    setActiveTab("projects");
    pushNav({ tab: "projects", projectId, subjectId: null, goalId: null });
    setTimeout(() => setLoadingProjectId(null), 300);
  };

  const handleReorderSubjects = async (newSubjects: Subject[]) => {
    setSubjects(newSubjects);
    try {
      if (activeUser?.id) {
        localStorage.setItem(`kaizu_cached_subjects_${activeUser.id}`, JSON.stringify(newSubjects));
      }
      localStorage.setItem("kaizu_cached_subjects", JSON.stringify(newSubjects));
    } catch (e) {}
    try {
      await Api.reorderSubjects(newSubjects.map((s) => s.id));
    } catch (err: any) {
      console.error("Failed to persist subject reorder:", err);
    }
  };

  const handleReorderGoals = async (newGoals: Goal[]) => {
    setGoals(newGoals);
    try {
      if (activeUser?.id) {
        localStorage.setItem(`kaizu_cached_goals_${activeUser.id}`, JSON.stringify(newGoals));
      }
      localStorage.setItem("kaizu_cached_goals", JSON.stringify(newGoals));
    } catch (e) {}
    try {
      await Api.reorderGoals(newGoals.map((g) => g.id));
    } catch (err: any) {
      console.error("Failed to persist goal reorder:", err);
    }
  };

  const handleUserChanged = () => {
    setActiveUser(null);
    setSubjects([]);
    setGoals([]);
    setSelectedSubject(null);
    setSelectedGoalDetail(null);
    setSelectedProjectId(null);
    replaceNav({ tab: "dashboard", subjectId: null, goalId: null, projectId: null });
    fetchData();
  };

  const resetSelection = () => {
    setSelectedSubject(null);
    setSelectedGoalDetail(null);
    setSelectedProjectId(null);
  };

  const handleSelectTab = (tab: string) => {
    if (tab === activeTab && !selectedSubject && !selectedGoalDetail && !selectedProjectId) {
      return;
    }
    resetSelection();
    setActiveTab(tab);
    if (tab !== "settings") {
      setPreviousView(null);
    }
    pushNav({ tab, subjectId: null, goalId: null, projectId: null });
  };

  const isSettingsOpen =
    activeTab === "settings" &&
    !selectedSubject &&
    !selectedGoalDetail &&
    !selectedProjectId;

  const handleToggleSettings = () => {
    if (isSettingsOpen) {
      handleBack();
    } else {
      setPreviousView({
        tab: activeTab,
        selectedSubject,
        selectedGoalDetail,
        selectedProjectId,
      });
      resetSelection();
      setActiveTab("settings");
      pushNav({ tab: "settings", isSettings: true, subjectId: null, goalId: null, projectId: null });
    }
  };

  // If initial auth check is running
  if (loading && !activeUser) {
    return <KaizuLoader />;
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
        onToggleSidebar={handleToggleSidebar}
        onOpenQuickAdd={() => handleOpenModal("quickCapture")}
        onToggleSettings={handleToggleSettings}
        onSelectTab={handleSelectTab}
      />

      {/* Main Container */}
      <div className="flex flex-1 pt-14 sm:pt-16">
        {/* Sidebar Navigation */}
        <Sidebar
          isOpen={isSidebarOpen}
          onToggleSidebar={handleToggleSidebar}
          activeTab={activeTab}
          onSelectTab={handleSelectTab}
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
              user={activeUser}
              subjects={subjects}
              goals={goals}
              onSelectTab={handleSelectTab}
              onSelectSubject={handleSelectSubject}
              onSelectGoal={handleSelectGoal}
              onOpenCreateSubject={() => handleOpenModal("subject")}
              onOpenCreateGoal={() => handleOpenModal("goal")}
              loadingSubjectId={loadingSubjectId}
              loadingGoalId={loadingGoalId}
            />
          )}

          {activeTab === "subjects" && (
            selectedSubject ? (
              <SubjectDetailView
                subject={selectedSubject}
                onBack={handleBackFromSubject}
                onRefresh={refreshCurrentSubject}
              />
            ) : getInitialNav().subjectId ? (
              <KaizuLoader />
            ) : (
              <SubjectsView
                subjects={subjects}
                onSelectSubject={handleSelectSubject}
                onOpenCreateSubject={() => handleOpenModal("subject")}
                loadingSubjectId={loadingSubjectId}
                onReorderSubjects={handleReorderSubjects}
              />
            )
          )}

          {activeTab === "goals" && (
            selectedGoalDetail ? (
              <GoalDetailView
                goalDetail={selectedGoalDetail}
                onBack={handleBackFromGoal}
                onRefresh={refreshCurrentGoal}
              />
            ) : getInitialNav().goalId ? (
              <KaizuLoader />
            ) : (
              <GoalsView
                goals={goals}
                onSelectGoal={handleSelectGoal}
                onOpenCreateGoal={() => handleOpenModal("goal")}
                onRefresh={fetchData}
                loadingGoalId={loadingGoalId}
                onReorderGoals={handleReorderGoals}
              />
            )
          )}

          {activeTab === "projects" && (
            selectedProjectId ? (
              <ProjectDetailView
                projectId={selectedProjectId}
                onBack={handleBackFromProject}
              />
            ) : (
              <ProjectsView
                onSelectProject={handleSelectProject}
                loadingProjectId={loadingProjectId}
              />
            )
          )}

          {activeTab === "activity" && (
            <ActivityView subjects={subjects} goals={goals} userId={activeUser?.id} />
          )}

          {activeTab === "settings" && (
            <SettingsView onUserChanged={handleUserChanged} />
          )}
        </main>
      </div>

      {/* Modals */}
      <CreateSubjectModal
        isOpen={showCreateSubject}
        onClose={handleCloseModal}
        onSuccess={() => {
          fetchData();
          setActiveTab("subjects");
          setSelectedSubject(null);
          replaceNav({ tab: "subjects", subjectId: null, goalId: null, projectId: null });
        }}
      />

      <CreateGoalModal
        isOpen={showCreateGoal}
        onClose={handleCloseModal}
        onSuccess={() => {
          fetchData();
          setActiveTab("goals");
          setSelectedGoalDetail(null);
          replaceNav({ tab: "goals", goalId: null, subjectId: null, projectId: null });
        }}
      />

      <QuickCaptureModal
        isOpen={showQuickCapture}
        goals={goals}
        onClose={handleCloseModal}
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
