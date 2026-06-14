import { format, parseISO } from "date-fns";
import {
  goalRepository,
  milestoneRepository,
  projectRepository,
  reviewRepository,
  taskRepository,
  type GoalHorizon,
} from "@/lib/data";

const HORIZON_LABEL: Record<GoalHorizon, string> = {
  north_star: "North star",
  long_term: "Long-term",
  quarter: "Quarter",
};

/**
 * Builds a concise, read-only snapshot of the workspace to ground the
 * assistant. Runs entirely on the client (it reads IndexedDB through the
 * repositories); the result is passed to the proxy route as the system prompt,
 * so the server never reads app data.
 */
export async function buildWorkspaceContext(): Promise<string> {
  const [goals, projects, tasks, milestones, reviews] = await Promise.all([
    goalRepository.list(),
    projectRepository.list(),
    taskRepository.list(),
    milestoneRepository.list(),
    reviewRepository.list(),
  ]);

  const todayIso = format(new Date(), "yyyy-MM-dd");
  const lines: string[] = [];

  lines.push(`Today is ${format(new Date(), "EEEE, d MMMM yyyy")}.`);
  lines.push("");

  lines.push("### Goals");
  if (goals.length === 0) {
    lines.push("(none yet)");
  } else {
    for (const goal of goals) {
      lines.push(
        `- [${HORIZON_LABEL[goal.horizon]} · ${goal.status}] ${goal.title}` +
          (goal.targetMetric ? ` — target: ${goal.targetMetric}` : ""),
      );
    }
  }
  lines.push("");

  lines.push("### Projects");
  if (projects.length === 0) {
    lines.push("(none yet)");
  } else {
    for (const project of projects) {
      const projectTasks = tasks.filter((t) => t.projectId === project.id);
      const done = projectTasks.filter((t) => t.status === "done").length;
      lines.push(
        `- [${project.status}] ${project.title} — ${done}/${projectTasks.length} tasks done`,
      );
    }
  }
  lines.push("");

  const dueToday = tasks.filter(
    (t) => t.dueDate === todayIso && t.status !== "done",
  );
  const doing = tasks.filter((t) => t.status === "doing");
  lines.push("### Tasks");
  lines.push(
    `Open tasks: ${tasks.filter((t) => t.status !== "done").length}. In progress: ${doing.length}.`,
  );
  if (dueToday.length > 0) {
    lines.push("Due today:");
    for (const task of dueToday) lines.push(`- ${task.title}`);
  }
  lines.push("");

  const upcoming = milestones
    .filter((m) => m.status === "planned" && m.date >= todayIso)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5);
  lines.push("### Upcoming milestones");
  if (upcoming.length === 0) {
    lines.push("(none scheduled)");
  } else {
    for (const milestone of upcoming) {
      lines.push(
        `- ${format(parseISO(milestone.date), "d MMM yyyy")}: ${milestone.title}`,
      );
    }
  }
  lines.push("");

  const latestReview = reviews
    .slice()
    .sort((a, b) => b.weekStart.localeCompare(a.weekStart))[0];
  if (latestReview) {
    lines.push("### Most recent weekly review");
    lines.push(`Week of ${latestReview.weekStart}`);
    if (latestReview.nextFocus.trim()) {
      lines.push(`Next focus: ${latestReview.nextFocus.trim()}`);
    }
  }

  return lines.join("\n");
}

export function buildSystemPrompt(context: string): string {
  return [
    "You are the built-in assistant for Solo Studio, a local-first workspace for a solo operator (freelancer / solopreneur).",
    "Help the user think through their goals, projects, tasks, milestones, and weekly reviews. Be concise, concrete, and action-oriented — prefer short answers and bulleted next steps.",
    "You can see a read-only snapshot of their workspace below. Refer to items by their titles. You cannot change their data directly; when you suggest changes, describe the action they can take in the app (e.g. \"move this task to Doing on the Tasks board\").",
    "",
    "## Workspace snapshot",
    context,
  ].join("\n");
}
