import type { Goal, GoalHorizon, GoalStatus } from "@/lib/data";

export const HORIZON_LABEL: Record<GoalHorizon, string> = {
  north_star: "North star",
  long_term: "Long-term",
  quarter: "Quarter",
};

/** The horizon a goal's children take, or null if it can't have children. */
export const CHILD_HORIZON: Record<GoalHorizon, GoalHorizon | null> = {
  north_star: "long_term",
  long_term: "quarter",
  quarter: null,
};

export const GOAL_STATUSES: GoalStatus[] = [
  "active",
  "achieved",
  "paused",
  "dropped",
];

export const STATUS_LABEL: Record<GoalStatus, string> = {
  active: "Active",
  achieved: "Achieved",
  paused: "Paused",
  dropped: "Dropped",
};

export const STATUS_COLOR: Record<
  GoalStatus,
  "primary" | "success" | "warning" | "default"
> = {
  active: "primary",
  achieved: "success",
  paused: "warning",
  dropped: "default",
};

/**
 * Everything a GoalNode needs to render and mutate the tree, bundled so the
 * recursive node component takes a single prop. Owned by GoalsView.
 */
export interface GoalTreeController {
  childrenOf(parentId: string | null): Goal[];
  isExpanded(id: string): boolean;
  toggleExpanded(id: string): void;
  expand(id: string): void;
  editingId: string | null;
  setEditingId(id: string | null): void;
  addingParentId: string | null;
  setAddingParentId(id: string | null): void;
  createChild(parent: Goal, title: string): Promise<void>;
  rename(goal: Goal, title: string): Promise<void>;
  setStatus(goal: Goal, status: GoalStatus): Promise<void>;
  archive(goal: Goal): Promise<void>;
}
