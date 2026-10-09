import { prisma } from "../../database/prisma";

export interface ContextData {
  summary: {
    userName: string;
    totalGoals: number;
    activeGoalsCount: number;
    totalSubjects: number;
    totalProjects: number;
  };
  activeGoals: Array<{
    id: string;
    title: string;
    status: string;
    targetDate: string | null;
    description: string | null;
    pendingTasks: string[];
    completedTasksCount: number;
  }>;
  subjects: Array<{
    id: string;
    name: string;
    chaptersCount: number;
    topicsCount: number;
    inProgressTopics: string[];
  }>;
  projects: Array<{
    id: string;
    name: string;
    status: string;
    nextAction: string | null;
    targetDate: string | null;
  }>;
  recentActivity: Array<{
    type: "GOAL_ACTION" | "STUDY_SESSION" | "PROJECT_WORK";
    summary: string;
    outcome?: string | null;
    date: string;
  }>;
  activePageDetails?: any;
}

export class AssistantContextService {
  /**
   * Sanitizer to ensure no accidental API keys, tokens, or credentials are sent to Gemini
   */
  private static sanitize(text: string | null | undefined): string {
    if (!text) return "";
    return text
      .replace(/(?:key|secret|token|password|bearer|auth)[=:\s]+[A-Za-z0-9_\-\.]{8,}/gi, "[REDACTED]")
      .replace(/AIza[0-9A-Za-z-_]{35}/g, "[REDACTED_API_KEY]")
      .replace(/postgres(?:ql)?:\/\/[^\s]+/gi, "[REDACTED_DATABASE_URL]");
  }

  /**
   * Assemble bounded, real context for the signed-in user
   */
  static async assembleUserContext(
    userId: string,
    userName: string,
    pageContext?: { type?: string; recordId?: string; recordName?: string }
  ): Promise<string> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // 1. Fetch Goals
    const goals = await prisma.goal.findMany({
      where: { userId, status: "ACTIVE" },
      include: {
        tasks: {
          take: 5,
          where: { status: { not: "COMPLETED" } },
          select: { title: true, priority: true, dueDate: true },
        },
      },
      take: 6,
      orderBy: { updatedAt: "desc" },
    });

    // 2. Fetch Subjects & Topics
    const subjects = await prisma.subject.findMany({
      where: { userId },
      include: {
        chapters: {
          include: {
            topics: {
              where: { status: "LEARNING" },
              select: { title: true },
              take: 3,
            },
          },
        },
      },
      take: 6,
      orderBy: { updatedAt: "desc" },
    });

    // 3. Fetch Projects
    const projects = await prisma.project.findMany({
      where: { userId, status: { in: ["ACTIVE", "IN_PROGRESS"] } },
      select: {
        id: true,
        name: true,
        status: true,
        nextAction: true,
        targetDate: true,
      },
      take: 6,
      orderBy: { updatedAt: "desc" },
    });

    // 4. Fetch Recent Activity Logs (Past 7 days)
    const recentDailyActions = await prisma.dailyAction.findMany({
      where: {
        goal: { userId },
        occurredAt: { gte: sevenDaysAgo },
      },
      select: {
        summary: true,
        outcome: true,
        occurredAt: true,
        goal: { select: { title: true } },
      },
      orderBy: { occurredAt: "desc" },
      take: 6,
    });

    const recentStudySessions = await prisma.studySession.findMany({
      where: {
        subject: { userId },
        occurredAt: { gte: sevenDaysAgo },
      },
      select: {
        summary: true,
        occurredAt: true,
        subject: { select: { name: true } },
      },
      orderBy: { occurredAt: "desc" },
      take: 5,
    });

    // 5. Specific Page Context if provided
    let pageSpecificInfo = "";
    if (pageContext?.recordId) {
      if (pageContext.type === "goal") {
        const goalDetail = await prisma.goal.findFirst({
          where: { id: pageContext.recordId, userId },
          include: {
            milestones: { include: { tasks: true } },
            tasks: true,
            reflections: { take: 3, orderBy: { createdAt: "desc" } },
          },
        });
        if (goalDetail) {
          pageSpecificInfo = `Current Page Goal Focus: "${goalDetail.title}" (Status: ${goalDetail.status}, Success Criteria: ${goalDetail.successDefinition || "Not specified"}). Milestones: ${goalDetail.milestones.map((m) => `${m.title} (${m.status})`).join(", ") || "None"}. Tasks: ${goalDetail.tasks.map((t) => `${t.title} [${t.status}]`).join(", ") || "None"}.`;
        }
      } else if (pageContext.type === "subject") {
        const subjectDetail = await prisma.subject.findFirst({
          where: { id: pageContext.recordId, userId },
          include: {
            chapters: {
              include: { topics: true },
            },
          },
        });
        if (subjectDetail) {
          pageSpecificInfo = `Current Page Subject Focus: "${subjectDetail.name}". Chapters: ${subjectDetail.chapters.map((c) => `${c.title} (${c.topics.length} topics)`).join(", ") || "None"}.`;
        }
      } else if (pageContext.type === "project") {
        const projectDetail = await prisma.project.findFirst({
          where: { id: pageContext.recordId, userId },
          include: {
            tasks: true,
            notes: { take: 3 },
          },
        });
        if (projectDetail) {
          pageSpecificInfo = `Current Page Project Focus: "${projectDetail.name}" (Status: ${projectDetail.status}, Next Action: "${projectDetail.nextAction || "None"}"). Tasks: ${projectDetail.tasks.map((t) => `${t.title} [${t.status}]`).join(", ") || "None"}.`;
        }
      }
    }

    // Format structured text with sanitization applied
    const activeGoalsFormatted = goals.map((g) => ({
      title: this.sanitize(g.title),
      targetDate: g.targetDate ? g.targetDate.toISOString().split("T")[0] : null,
      pendingTasks: g.tasks.map((t) => this.sanitize(t.title)),
    }));

    const subjectsFormatted = subjects.map((s) => ({
      name: this.sanitize(s.name),
      chaptersCount: s.chapters.length,
      topicsLearning: s.chapters.flatMap((c) => c.topics.map((t) => this.sanitize(t.title))),
    }));

    const projectsFormatted = projects.map((p) => ({
      name: this.sanitize(p.name),
      status: p.status,
      nextAction: this.sanitize(p.nextAction),
    }));

    const recentLogsFormatted = [
      ...recentDailyActions.map((a) => `[Goal: ${this.sanitize(a.goal.title)}] ${this.sanitize(a.summary)} (${a.occurredAt.toISOString().split("T")[0]})`),
      ...recentStudySessions.map((s) => `[Subject: ${this.sanitize(s.subject.name)}] ${this.sanitize(s.summary)} (${s.occurredAt.toISOString().split("T")[0]})`),
    ];

    return `
### USER KAIZU PROFILE
- Name: ${this.sanitize(userName)}
- Active Goals: ${activeGoalsFormatted.length > 0 ? JSON.stringify(activeGoalsFormatted) : "No active goals created yet."}
- Subjects & Topics: ${subjectsFormatted.length > 0 ? JSON.stringify(subjectsFormatted) : "No subjects created yet."}
- Ongoing Projects: ${projectsFormatted.length > 0 ? JSON.stringify(projectsFormatted) : "No projects created yet."}
- Recent Evidence & Activity (Past 7 Days): ${recentLogsFormatted.length > 0 ? recentLogsFormatted.join("; ") : "No recent activity logged in the past 7 days."}
${pageSpecificInfo ? `\n### CURRENT VIEW CONTEXT\n${this.sanitize(pageSpecificInfo)}` : ""}
`.trim();
  }
}
