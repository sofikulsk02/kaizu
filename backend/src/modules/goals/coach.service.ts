import { prisma } from "../../database/prisma";
import { NotFoundError } from "../../core/ApiError";
import { GoalService } from "./goal.service";

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
  suggestedMilestones?: {
    title: string;
    description: string;
    tasks: string[];
  }[];
}

export class GoalCoachService {
  public static async getCoachAnalysis(userId: string, goalId: string): Promise<CoachAnalysis> {
    const goal = await GoalService.getGoalById(userId, goalId);

    const totalTasks = goal.tasks.length;
    const completedTasks = goal.metrics.completedTasksCount;
    const activeDays = goal.metrics.activeDaysCount;
    const totalDuration = goal.metrics.totalDurationMinutes;
    const unfinishedTasks = goal.tasks.filter((t) => t.status !== "COMPLETED");

    // Collect blockers from daily actions and reflections
    const blockersSet = new Set<string>();
    goal.dailyActions.forEach((act) => {
      if (act.blocker) blockersSet.add(act.blocker.trim());
    });
    goal.reflections.forEach((ref) => {
      if (ref.difficulty) blockersSet.add(ref.difficulty.trim());
    });
    const recurringBlockers = Array.from(blockersSet);

    // Stalled Goal Check
    const daysSinceCreated = Math.floor(
      (Date.now() - new Date(goal.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    );

    let isStalled = false;
    let stalledReason: string | undefined = undefined;

    if (totalTasks > 0 && completedTasks === 0 && daysSinceCreated >= 3) {
      isStalled = true;
      stalledReason = `This goal has ${totalTasks} planned tasks but none completed in the past ${daysSinceCreated} days.`;
    } else if (goal.dailyActions.length === 0 && daysSinceCreated >= 4) {
      isStalled = true;
      stalledReason = `No daily work has been logged for this goal yet.`;
    }

    // Generate Contextual Advice based on Kaizu Hansei & Kaizen loop
    let advice = "";
    let recommendedAction: CoachAnalysis["recommendedAction"] = undefined;

    if (isStalled) {
      advice = `Your goal "${goal.title}" appears stalled. Big outcomes feel overwhelming when broken into large tasks. Try picking ONE 15-minute action today to break momentum inertia.`;
      if (unfinishedTasks.length > 0) {
        recommendedAction = {
          title: unfinishedTasks[0].title,
          reason: "Smallest immediate task to regain momentum.",
          taskId: unfinishedTasks[0].id,
        };
      } else {
        recommendedAction = {
          title: "Plan your first 15-minute task",
          reason: "Define a concrete, immediate first step.",
        };
      }
    } else if (totalDuration > 120 && completedTasks === 0) {
      advice = `You've spent over 2 hours exploring and planning, but haven't marked any task completed. Shift focus from research to concrete execution: pick 1 issue or repository and submit an initial output this week.`;
      recommendedAction = {
        title: unfinishedTasks[0]?.title || "Execute first concrete task",
        reason: "Convert research effort into tangible output.",
        taskId: unfinishedTasks[0]?.id,
      };
    } else if (completedTasks > 0 && completedTasks === totalTasks) {
      advice = `Outstanding progress! All ${totalTasks} planned tasks are complete. Review your outcome criteria to see if this goal is ready to be marked COMPLETED, or add your next milestone stage.`;
    } else {
      advice = `Keep up the momentum! You've logged ${activeDays} active days of effort. Focus on finishing current high-priority tasks before adding more planning overhead.`;
      if (unfinishedTasks.length > 0) {
        const topTask = unfinishedTasks.find((t) => t.priority === "HIGH") || unfinishedTasks[0];
        recommendedAction = {
          title: topTask.title,
          reason: "Highest priority next action.",
          taskId: topTask.id,
        };
      }
    }

    return {
      goalId,
      isStalled,
      stalledReason,
      advice,
      recommendedAction,
      recurringBlockers,
    };
  }

  public static async generateGoalBreakdown(userId: string, goalId: string) {
    const goal = await GoalService.getGoalById(userId, goalId);

    // Intelligent templates based on goal title and category
    const titleLower = goal.title.toLowerCase();
    const categoryLower = (goal.category || "").toLowerCase();

    let suggestedMilestones = [
      {
        title: "Milestone 1 — Discovery & Setup",
        description: "Explore guidelines, set up local environment, and outline requirements.",
        tasks: ["Research application & contribution guidelines", "Set up development environment locally", "Review initial issues and codebase architecture"],
      },
      {
        title: "Milestone 2 — Core Execution & Initial Deliverables",
        description: "Implement initial features, solve key issues, and document findings.",
        tasks: ["Work on first good first issue / task", "Submit draft work and gather feedback", "Refine implementation based on review"],
      },
      {
        title: "Milestone 3 — Finalization & Polish",
        description: "Complete final requirements, write documentation, and submit final outcome.",
        tasks: ["Finalize core deliverables", "Prepare proposal / presentation", "Submit final output before deadline"],
      },
    ];

    if (titleLower.includes("gsoc") || categoryLower.includes("open source")) {
      suggestedMilestones = [
        {
          title: "Milestone 1 — Choose an organization & tech stack",
          description: "Explore participating orgs, contribution guidelines, and communication channels.",
          tasks: ["Research 2-3 target GSoC organizations", "Join mentor channels (Slack/Matrix/IRC)", "Set up repository locally and build main branch"],
        },
        {
          title: "Milestone 2 — Understand codebase & make initial PR",
          description: "Explore repository architecture, reproduce an issue, and submit first pull request.",
          tasks: ["Find a 'good first issue' or bug to fix", "Write test cases and implement bug fix", "Submit pull request and address mentor review feedback"],
        },
        {
          title: "Milestone 3 — Prepare & submit final GSoC proposal",
          description: "Draft proposal with project timeline, milestone deliverables, and submit on time.",
          tasks: ["Draft GSoC proposal outline and timeline", "Share proposal draft with org mentors for review", "Submit finalized proposal on official GSoC portal"],
        },
      ];
    } else if (titleLower.includes("system design") || titleLower.includes("dsa") || categoryLower.includes("learning")) {
      suggestedMilestones = [
        {
          title: "Milestone 1 — Fundamentals & Core Concepts",
          description: "Master foundational building blocks and key design patterns.",
          tasks: ["Study key theoretical concepts for 45 mins", "Document summary notes and architectural diagrams", "Solve 3 practice problems"],
        },
        {
          title: "Milestone 2 — Hands-on Practice & Case Studies",
          description: "Design real-world systems and write prototype implementations.",
          tasks: ["Design scalable architecture for key service", "Identify bottlenecks, caching strategies, and DB sharding", "Conduct peer mock session"],
        },
      ];
    }

    // Auto-create suggested milestones and tasks in database for user
    for (let i = 0; i < suggestedMilestones.length; i++) {
      const ms = suggestedMilestones[i];
      const createdMs = await prisma.milestone.create({
        data: {
          goalId: goal.id,
          title: ms.title,
          description: ms.description,
          sortOrder: i,
          status: "UPCOMING",
        },
      });

      for (let j = 0; j < ms.tasks.length; j++) {
        await prisma.goalTask.create({
          data: {
            goalId: goal.id,
            milestoneId: createdMs.id,
            title: ms.tasks[j],
            priority: j === 0 ? "HIGH" : "MEDIUM",
            sortOrder: j,
            status: "TODO",
          },
        });
      }
    }

    return GoalService.getGoalById(userId, goalId);
  }
}
