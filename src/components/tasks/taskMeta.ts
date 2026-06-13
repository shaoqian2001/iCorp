import type { TaskStatus } from "@/lib/data";

/** Kanban columns in left-to-right order. */
export const TASK_COLUMNS: { status: TaskStatus; label: string }[] = [
  { status: "todo", label: "To do" },
  { status: "doing", label: "Doing" },
  { status: "done", label: "Done" },
];
