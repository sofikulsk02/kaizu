"use client";

import React from "react";
import {
  Target,
  BarChart2,
  Zap,
  BookOpen,
  Brain,
  Calendar,
  Wrench,
  AlertTriangle,
  Sprout,
  Compass,
  RotateCcw,
} from "lucide-react";

interface MichiStarterPromptsProps {
  pageType?: "dashboard" | "subject" | "goal" | "project" | "activity" | "settings";
  recordName?: string;
  onSelectPrompt: (promptText: string) => void;
}

interface PromptItem {
  icon: React.ReactNode;
  text: string;
}

export const MichiStarterPrompts: React.FC<MichiStarterPromptsProps> = ({
  pageType,
  recordName,
  onSelectPrompt,
}) => {
  const getPrompts = (): PromptItem[] => {
    switch (pageType) {
      case "goal":
        return [
          {
            icon: <Target className="h-4 w-4 text-[var(--crimson)]" />,
            text: recordName
              ? `Help me break down "${recordName}" into practical next steps.`
              : "Help me break down my goal into practical next steps.",
          },
          {
            icon: <BarChart2 className="h-4 w-4 text-[var(--forest-green)]" />,
            text: "Analyze my progress and recent actions on this goal.",
          },
          {
            icon: <Zap className="h-4 w-4 text-amber-500" />,
            text: "What is the single highest-leverage task I should do today?",
          },
        ];
      case "subject":
        return [
          {
            icon: <BookOpen className="h-4 w-4 text-[var(--forest-green)]" />,
            text: recordName
              ? `What should I study next in "${recordName}"?`
              : "What should I study next based on my tracked topics?",
          },
          {
            icon: <Brain className="h-4 w-4 text-purple-600" />,
            text: "Suggest an effective Hansei reflection for my recent study sessions.",
          },
          {
            icon: <Calendar className="h-4 w-4 text-[var(--forest-green)]" />,
            text: "Help me organize a realistic study schedule for this subject.",
          },
        ];
      case "project":
        return [
          {
            icon: <Wrench className="h-4 w-4 text-[var(--forest-green)]" />,
            text: recordName
              ? `Review the next immediate actions for "${recordName}".`
              : "What is the immediate next action for this project?",
          },
          {
            icon: <AlertTriangle className="h-4 w-4 text-amber-500" />,
            text: "Help me identify potential blockers in my current milestones.",
          },
        ];
      default:
        return [
          {
            icon: <Target className="h-4 w-4 text-[var(--crimson)]" />,
            text: "What should I focus on today based on my goals and habits?",
          },
          {
            icon: <Sprout className="h-4 w-4 text-[var(--forest-green)]" />,
            text: "Review my accomplishments and activity from the past week.",
          },
          {
            icon: <RotateCcw className="h-4 w-4 text-amber-600" />,
            text: "Where is my momentum stalling, and what small Kaizen step can restart it?",
          },
          {
            icon: <Compass className="h-4 w-4 text-[var(--forest-green)]" />,
            text: "Help me plan a high-focus day around my most important goal.",
          },
        ];
    }
  };

  const prompts = getPrompts();

  return (
    <div className="space-y-3 py-2">
      <div className="text-center px-4 space-y-1.5 pt-4">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--pale-sage)] text-[var(--forest-green)] text-base font-black shadow-xs">
          道
        </div>
        <h3 className="text-sm font-bold text-[var(--text-heading)]">
          Konnichiwa! I am Michi.
        </h3>
        <p className="text-xs text-[var(--text-muted)] max-w-xs mx-auto leading-relaxed">
          Your grounded continuous improvement guide. I reason about your Kaizu goals, study areas, and daily evidence.
        </p>
      </div>

      <div className="px-3 pt-2">
        <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] px-1 mb-2">
          Suggested Explorations
        </div>
        <div className="space-y-1.5">
          {prompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => onSelectPrompt(p.text)}
              className="w-full text-left p-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--surface-primary)] hover:bg-[var(--surface-secondary)] hover:border-[var(--forest-green)] transition text-xs font-medium text-[var(--text-primary)] flex items-start space-x-2.5 shadow-2xs group cursor-pointer"
            >
              <span className="shrink-0 mt-0.5 group-hover:scale-110 transition-transform">
                {p.icon}
              </span>
              <span className="leading-snug">{p.text}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
