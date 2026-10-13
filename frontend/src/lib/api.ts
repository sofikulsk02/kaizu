const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  createdAt: string;
}

export type TopicStatus = "NOT_STARTED" | "LEARNING" | "STUDIED" | "NEEDS_REVISION" | "UNDERSTOOD";

export interface Topic {
  id: string;
  chapterId: string;
  title: string;
  status: TopicStatus;
  confidence: number | null;
  notes: string | null;
  resources: string | null;
  nextStep: string | null;
  revisionDate: string | null;
  lastStudiedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Chapter {
  id: string;
  subjectId: string;
  title: string;
  description?: string;
  topics: Topic[];
  createdAt: string;
  updatedAt: string;
}

export interface StudySession {
  id: string;
  userId: string;
  subjectId: string;
  chapterId: string | null;
  topicId: string | null;
  summary: string;
  durationMinutes: number;
  occurredAt: string;
  confidence: number | null;
  outcome: string | null;
  nextStep: string | null;
  chapter?: { id: string; title: string } | null;
  topic?: { id: string; title: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface SubjectMetrics {
  totalTimeStudiedMinutes: number;
  activeDaysCount: number;
  topicsTrackedCount: number;
  topicsStudiedCount: number;
  topicsNeedingRevisionCount: number;
}

export interface ContinueLearning {
  lastTopicId: string | null;
  lastTopicTitle: string | null;
  lastStudiedAt: string | null;
  lastDurationMinutes: number | null;
  nextStep: string | null;
}

export interface Subject {
  id: string;
  userId: string;
  name: string;
  description?: string;
  chapterCount?: number;
  topicCount?: number;
  chapters?: Chapter[];
  studySessions?: StudySession[];
  metrics?: SubjectMetrics;
  continueLearning?: ContinueLearning;
  sortOrder?: number;
  createdAt: string;
  updatedAt: string;
}

export type GoalStatus = "ACTIVE" | "COMPLETED" | "PAUSED" | "STOPPED";
export type ProjectStatus = "ACTIVE" | "IN_PROGRESS" | "COMPLETED" | "PAUSED" | "STOPPED";
export type MilestoneStatus = "UPCOMING" | "IN_PROGRESS" | "COMPLETED" | "PAUSED";
export type TaskStatus = "TODO" | "IN_PROGRESS" | "COMPLETED";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH";

export interface ProjectTask {
  id: string;
  projectId: string;
  milestoneId?: string | null;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string | null;
  estimateMinutes?: number | null;
  sortOrder: number;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectMilestone {
  id: string;
  projectId: string;
  title: string;
  description?: string | null;
  targetDate?: string | null;
  status: MilestoneStatus;
  sortOrder: number;
  tasks: ProjectTask[];
  createdAt: string;
  updatedAt: string;
}

export interface ProjectWorkSession {
  id: string;
  userId: string;
  projectId: string;
  milestoneId?: string | null;
  taskId?: string | null;
  summary: string;
  occurredAt: string;
  durationMinutes: number;
  outcome?: string | null;
  blocker?: string | null;
  nextStep?: string | null;
  milestone?: { id: string; title: string } | null;
  task?: { id: string; title: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectNote {
  id: string;
  projectId: string;
  title: string;
  category?: string | null;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectMetrics {
  completedTasksCount: number;
  totalTasksCount: number;
  taskProgressPercentage: number | null;
  completedMilestonesCount: number;
  totalMilestonesCount: number;
  totalEffortMinutes: number;
  activeDaysCount: number;
}

export interface ProjectListItem {
  id: string;
  userId: string;
  goalId?: string | null;
  subjectId?: string | null;
  name: string;
  description?: string | null;
  category?: string | null;
  status: ProjectStatus;
  targetDate?: string | null;
  nextAction?: string | null;
  completedAt?: string | null;
  milestoneCount: number;
  currentMilestoneTitle?: string | null;
  totalTasksCount: number;
  completedTasksCount: number;
  totalEffortMinutes: number;
  sortOrder?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectDetail {
  id: string;
  userId: string;
  goalId?: string | null;
  subjectId?: string | null;
  name: string;
  description?: string | null;
  category?: string | null;
  status: ProjectStatus;
  targetDate?: string | null;
  nextAction?: string | null;
  completedAt?: string | null;
  milestones: ProjectMilestone[];
  directTasks: ProjectTask[];
  workSessions: ProjectWorkSession[];
  notes: ProjectNote[];
  metrics: ProjectMetrics;
  currentMilestone?: { id: string; title: string; status: MilestoneStatus } | null;
  goal?: { id: string; title: string } | null;
  subject?: { id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface GoalTask {
  id: string;
  goalId: string;
  milestoneId?: string | null;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string | null;
  estimateMinutes?: number | null;
  sortOrder: number;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Milestone {
  id: string;
  goalId: string;
  title: string;
  description?: string | null;
  targetDate?: string | null;
  status: MilestoneStatus;
  sortOrder: number;
  tasks: GoalTask[];
  createdAt: string;
  updatedAt: string;
}

export interface Reflection {
  id: string;
  goalId: string;
  dailyActionId?: string | null;
  wentWell?: string | null;
  difficulty?: string | null;
  learning?: string | null;
  nextChange?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DailyAction {
  id: string;
  goalId: string;
  taskId?: string | null;
  milestoneId?: string | null;
  summary: string;
  occurredAt: string;
  durationMinutes?: number | null;
  outcome?: string | null;
  blocker?: string | null;
  nextStep?: string | null;
  task?: { id: string; title: string } | null;
  milestone?: { id: string; title: string } | null;
  reflections?: Reflection[];
  createdAt: string;
  updatedAt: string;
}

export interface GoalMetrics {
  completedTasksCount: number;
  totalTasksCount: number;
  taskProgressPercentage: number | null;
  completedMilestonesCount: number;
  totalMilestonesCount: number;
  milestoneProgressPercentage: number | null;
  totalDurationMinutes: number;
  activeDaysCount: number;
}

export interface Goal {
  id: string;
  userId: string;
  title: string;
  description?: string;
  category?: string;
  successDefinition?: string;
  targetDate?: string;
  status: GoalStatus;
  completedAt?: string;
  completedTasksCount?: number;
  totalTasksCount?: number;
  completedMilestonesCount?: number;
  totalMilestonesCount?: number;
  sortOrder?: number;
  createdAt: string;
  updatedAt: string;
}

export interface GoalDetail extends Goal {
  milestones: Milestone[];
  tasks: GoalTask[];
  directTasks: GoalTask[];
  dailyActions: DailyAction[];
  reflections: Reflection[];
  metrics: GoalMetrics;
  todaysFocusTask: GoalTask | null;
}

export interface CoachAnalysis {
  goalId: string;
  isStalled: boolean;
  stalledReason?: string;
  advice: string;
  recommendedAction?: {
    title: string;
    reason: string;
    taskId?: string;
  };
  recurringBlockers: string[];
}

export function getActiveUserId(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem("kaizu_user_id");
  }
  return null;
}

export function setActiveUserId(userId: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem("kaizu_user_id", userId);
  }
}

export function getJwtToken(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem("kaizu_jwt_token");
  }
  return null;
}

export function setJwtToken(token: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem("kaizu_jwt_token", token);
  }
}

export function clearAuth() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("kaizu_jwt_token");
    localStorage.removeItem("kaizu_user_id");
  }
}

export function isAuthenticated(): boolean {
  return !!(getJwtToken() || getActiveUserId());
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const userId = getActiveUserId();
  const jwtToken = getJwtToken();

  const isPublicAuthEndpoint =
    endpoint.startsWith("/auth/google") || endpoint.startsWith("/auth/dev-user");

  if (!jwtToken && !userId && !isPublicAuthEndpoint) {
    throw new Error("Authentication required. Please sign in with Google.");
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {}),
  };

  if (userId) {
    headers["x-user-id"] = userId;
  }

  if (jwtToken) {
    headers["Authorization"] = `Bearer ${jwtToken}`;
  }

  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const json = await res.json();

  if (!res.ok || json.statusCode !== "10000") {
    throw new Error(json.message || `API Error (${res.status})`);
  }

  return json.data as T;
}

export const Api = {
  // Auth
  getMe: () => request<User>("/auth/me"),
  getGoogleAuthUrl: () => request<{ url: string }>("/auth/google"),
  verifyGoogleIdToken: (idToken: string) =>
    request<{ user: User; token: string }>("/auth/google/verify", {
      method: "POST",
      body: JSON.stringify({ idToken }),
    }),
  createDevUser: (data: { id: string; email: string; name: string }) =>
    request<{ user: User; token: string }>("/auth/dev-user", { method: "POST", body: JSON.stringify(data) }),

  // Subjects
  getSubjects: () => request<Subject[]>("/subjects"),
  getSubjectById: (id: string) => request<Subject>(`/subjects/${id}`),
  createSubject: (data: { name: string; description?: string }) =>
    request<Subject>("/subjects", { method: "POST", body: JSON.stringify(data) }),
  updateSubject: (id: string, data: { name?: string; description?: string }) =>
    request<Subject>(`/subjects/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteSubject: (id: string) => request<{ success: boolean }>(`/subjects/${id}`, { method: "DELETE" }),
  reorderSubjects: (orderedIds: string[]) =>
    request<{ success: boolean }>("/subjects/reorder", { method: "PUT", body: JSON.stringify({ orderedIds }) }),

  // Study Sessions
  createStudySession: (
    subjectId: string,
    data: {
      summary: string;
      durationMinutes: number;
      occurredAt?: string;
      confidence?: number;
      outcome?: string;
      nextStep?: string;
      chapterId?: string;
      topicId?: string;
    }
  ) =>
    request<StudySession>(`/subjects/${subjectId}/sessions`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  deleteStudySession: (subjectId: string, sessionId: string) =>
    request<{ success: boolean }>(`/subjects/${subjectId}/sessions/${sessionId}`, {
      method: "DELETE",
    }),

  // Chapters
  createChapter: (subjectId: string, data: { title: string; description?: string }) =>
    request<Chapter>(`/chapters/subject/${subjectId}`, { method: "POST", body: JSON.stringify(data) }),
  updateChapter: (id: string, data: { title?: string; description?: string }) =>
    request<Chapter>(`/chapters/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteChapter: (id: string) => request<{ success: boolean }>(`/chapters/${id}`, { method: "DELETE" }),

  // Topics
  createTopic: (chapterId: string, data: { title: string }) =>
    request<Topic>(`/topics/chapter/${chapterId}`, { method: "POST", body: JSON.stringify(data) }),
  updateTopic: (
    id: string,
    data: {
      title?: string;
      status?: TopicStatus;
      confidence?: number | null;
      notes?: string | null;
      resources?: string | null;
      nextStep?: string | null;
      revisionDate?: string | null;
    }
  ) => request<Topic>(`/topics/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteTopic: (id: string) => request<{ success: boolean }>(`/topics/${id}`, { method: "DELETE" }),

  // Goals
  getGoals: (status?: GoalStatus) => request<Goal[]>(`/goals${status ? `?status=${status}` : ""}`),
  getGoalById: (id: string) => request<GoalDetail>(`/goals/${id}`),
  createGoal: (data: { title: string; description?: string; category?: string; successDefinition?: string; targetDate?: string; status?: GoalStatus }) =>
    request<Goal>("/goals", { method: "POST", body: JSON.stringify(data) }),
  updateGoal: (id: string, data: { title?: string; description?: string; category?: string | null; successDefinition?: string | null; targetDate?: string | null; status?: GoalStatus }) =>
    request<Goal>(`/goals/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteGoal: (id: string) => request<{ success: boolean }>(`/goals/${id}`, { method: "DELETE" }),
  reorderGoals: (orderedIds: string[]) =>
    request<{ success: boolean }>("/goals/reorder", { method: "PUT", body: JSON.stringify({ orderedIds }) }),

  // Intelligent Goal Coach & V2
  getCoachAnalysis: (goalId: string) => request<CoachAnalysis>(`/goals/${goalId}/coach`),
  generateGoalBreakdown: (goalId: string) => request<GoalDetail>(`/goals/${goalId}/coach/breakdown`, { method: "POST" }),
  quickCapture: (input: string, goalId?: string) =>
    request<{ success: boolean; summary: string; durationMinutes?: number; goalId: string }>(
      "/goals/quick-capture",
      { method: "POST", body: JSON.stringify({ input, goalId }) }
    ),

  // Milestones
  createMilestone: (goalId: string, data: { title: string; description?: string; targetDate?: string; status?: MilestoneStatus }) =>
    request<Milestone>(`/goals/${goalId}/milestones`, { method: "POST", body: JSON.stringify(data) }),
  updateMilestone: (goalId: string, milestoneId: string, data: { title?: string; description?: string | null; targetDate?: string | null; status?: MilestoneStatus }) =>
    request<Milestone>(`/goals/${goalId}/milestones/${milestoneId}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteMilestone: (goalId: string, milestoneId: string) =>
    request<{ success: boolean }>(`/goals/${goalId}/milestones/${milestoneId}`, { method: "DELETE" }),

  // Tasks
  createGoalTask: (goalId: string, data: { title: string; description?: string; milestoneId?: string; priority?: TaskPriority; dueDate?: string; estimateMinutes?: number; status?: TaskStatus }) =>
    request<GoalTask>(`/goals/${goalId}/tasks`, { method: "POST", body: JSON.stringify(data) }),
  updateGoalTask: (goalId: string, taskId: string, data: { title?: string; description?: string | null; milestoneId?: string | null; status?: TaskStatus; priority?: TaskPriority; dueDate?: string | null; estimateMinutes?: number | null }) =>
    request<GoalTask>(`/goals/${goalId}/tasks/${taskId}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteGoalTask: (goalId: string, taskId: string) =>
    request<{ success: boolean }>(`/goals/${goalId}/tasks/${taskId}`, { method: "DELETE" }),

  // Daily Actions
  createDailyAction: (goalId: string, data: { summary: string; taskId?: string; milestoneId?: string; occurredAt?: string; durationMinutes?: number; outcome?: string; blocker?: string; nextStep?: string; reflection?: { wentWell?: string; difficulty?: string; learning?: string; nextChange?: string } }) =>
    request<DailyAction>(`/goals/${goalId}/daily-actions`, { method: "POST", body: JSON.stringify(data) }),
  deleteDailyAction: (goalId: string, actionId: string) =>
    request<{ success: boolean }>(`/goals/${goalId}/daily-actions/${actionId}`, { method: "DELETE" }),

  // Projects
  getProjects: (status?: ProjectStatus) =>
    request<ProjectListItem[]>(`/projects${status ? `?status=${status}` : ""}`),
  getProjectById: (id: string) => request<ProjectDetail>(`/projects/${id}`),
  createProject: (data: {
    name: string;
    description?: string;
    category?: string;
    targetDate?: string;
    nextAction?: string;
    status?: ProjectStatus;
    goalId?: string;
    subjectId?: string;
  }) => request<ProjectListItem>("/projects", { method: "POST", body: JSON.stringify(data) }),
  updateProject: (
    id: string,
    data: {
      name?: string;
      description?: string | null;
      category?: string | null;
      targetDate?: string | null;
      nextAction?: string | null;
      status?: ProjectStatus;
      goalId?: string | null;
      subjectId?: string | null;
    }
  ) => request<ProjectDetail>(`/projects/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteProject: (id: string) => request<{ success: boolean }>(`/projects/${id}`, { method: "DELETE" }),
  reorderProjects: (orderedIds: string[]) =>
    request<{ success: boolean }>("/projects/reorder", { method: "PUT", body: JSON.stringify({ orderedIds }) }),

  // Project Milestones
  createProjectMilestone: (
    projectId: string,
    data: { title: string; description?: string; targetDate?: string; status?: MilestoneStatus }
  ) =>
    request<ProjectMilestone>(`/projects/${projectId}/milestones`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateProjectMilestone: (
    projectId: string,
    milestoneId: string,
    data: { title?: string; description?: string | null; targetDate?: string | null; status?: MilestoneStatus }
  ) =>
    request<ProjectMilestone>(`/projects/${projectId}/milestones/${milestoneId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  deleteProjectMilestone: (projectId: string, milestoneId: string) =>
    request<{ success: boolean }>(`/projects/${projectId}/milestones/${milestoneId}`, {
      method: "DELETE",
    }),

  // Project Tasks
  createProjectTask: (
    projectId: string,
    data: {
      title: string;
      description?: string;
      milestoneId?: string;
      priority?: TaskPriority;
      dueDate?: string;
      estimateMinutes?: number;
      status?: TaskStatus;
    }
  ) =>
    request<ProjectTask>(`/projects/${projectId}/tasks`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateProjectTask: (
    projectId: string,
    taskId: string,
    data: {
      title?: string;
      description?: string | null;
      milestoneId?: string | null;
      status?: TaskStatus;
      priority?: TaskPriority;
      dueDate?: string | null;
      estimateMinutes?: number | null;
    }
  ) =>
    request<ProjectTask>(`/projects/${projectId}/tasks/${taskId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  deleteProjectTask: (projectId: string, taskId: string) =>
    request<{ success: boolean }>(`/projects/${projectId}/tasks/${taskId}`, {
      method: "DELETE",
    }),

  // Project Work Sessions
  createProjectWorkSession: (
    projectId: string,
    data: {
      summary: string;
      durationMinutes: number;
      occurredAt?: string;
      outcome?: string;
      blocker?: string;
      nextStep?: string;
      milestoneId?: string;
      taskId?: string;
    }
  ) =>
    request<ProjectWorkSession>(`/projects/${projectId}/work-sessions`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  deleteProjectWorkSession: (projectId: string, sessionId: string) =>
    request<{ success: boolean }>(`/projects/${projectId}/work-sessions/${sessionId}`, {
      method: "DELETE",
    }),

  // Project Notes & Decisions
  createProjectNote: (
    projectId: string,
    data: { title: string; category?: string; content: string }
  ) =>
    request<ProjectNote>(`/projects/${projectId}/notes`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateProjectNote: (
    projectId: string,
    noteId: string,
    data: { title?: string; category?: string | null; content?: string }
  ) =>
    request<ProjectNote>(`/projects/${projectId}/notes/${noteId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  deleteProjectNote: (projectId: string, noteId: string) =>
    request<{ success: boolean }>(`/projects/${projectId}/notes/${noteId}`, {
      method: "DELETE",
    }),

  // ==========================================
  // Michi AI Assistant APIs
  // ==========================================
  getAssistantConversations: () =>
    request<AssistantConversationSummary[]>("/assistant/conversations"),

  getAssistantConversation: (id: string) =>
    request<AssistantConversationDetail>(`/assistant/conversations/${id}`),

  deleteAssistantConversation: (id: string) =>
    request<{ success: boolean }>(`/assistant/conversations/${id}`, {
      method: "DELETE",
    }),

  getAssistantUsage: () =>
    request<AssistantUsage>("/assistant/usage"),

  streamAssistantChat: async (
    params: {
      message: string;
      conversationId?: string;
      pageContext?: {
        type?: "dashboard" | "subject" | "goal" | "project" | "activity" | "settings";
        recordId?: string;
        recordName?: string;
      };
    },
    onChunk: (text: string) => void,
    onDone: (data: { conversationId: string; fullResponse: string }) => void,
    onError: (err: Error) => void
  ) => {
    const userId = getActiveUserId();
    const jwtToken = getJwtToken();

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (userId) headers["x-user-id"] = userId;
    if (jwtToken) headers["Authorization"] = `Bearer ${jwtToken}`;

    try {
      const response = await fetch(`${API_BASE_URL}/assistant/chat`, {
        method: "POST",
        headers,
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        let errMessage = `Error ${response.status}: Failed to reach Michi`;
        try {
          const errJson = await response.json();
          if (errJson.message) errMessage = errJson.message;
        } catch (_) {}
        throw new Error(errMessage);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("Streaming response not supported by browser");
      }

      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith("data: ")) {
            const dataStr = trimmed.slice(6);
            try {
              const data = JSON.parse(dataStr);
              if (data.type === "chunk" && data.text) {
                onChunk(data.text);
              } else if (data.type === "done") {
                onDone({
                  conversationId: data.conversationId,
                  fullResponse: data.fullResponse,
                });
              } else if (data.type === "error") {
                onError(new Error(data.error || "Assistant streaming error"));
              }
            } catch (e) {
              console.warn("Error parsing SSE data line:", trimmed, e);
            }
          }
        }
      }
    } catch (err: any) {
      onError(err);
    }
  },
};

export interface AssistantConversationSummary {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  lastMessagePreview?: string;
}

export interface AssistantMessageItem {
  id: string;
  conversationId: string;
  role: "USER" | "ASSISTANT" | "SYSTEM";
  content: string;
  createdAt: string;
}

export interface AssistantConversationDetail {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: AssistantMessageItem[];
}

export interface AssistantUsage {
  dailyRequestsUsed: number;
  dailyLimit: number;
  remaining: number;
}

