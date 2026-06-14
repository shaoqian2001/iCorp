import type { ProjectStatus } from "@/lib/data";

export const PROJECT_STATUSES: ProjectStatus[] = ["active", "done", "paused"];

export const PROJECT_STATUS_LABEL: Record<ProjectStatus, string> = {
  active: "Active",
  done: "Done",
  paused: "Paused",
};

export const PROJECT_STATUS_COLOR: Record<
  ProjectStatus,
  "primary" | "success" | "warning"
> = {
  active: "primary",
  done: "success",
  paused: "warning",
};
