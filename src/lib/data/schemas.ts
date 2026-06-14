import { z } from "zod";

/**
 * Single source of truth for every entity. TypeScript types are derived from
 * these schemas via `z.infer` (CLAUDE.md Architecture rule 4). Mutations
 * validate against these before writing.
 */

// --- Shared sync-ready fields (Architecture rule 2) -------------------------

const syncFields = {
  id: z.string().uuid(),
  userId: z.literal("local"),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  deletedAt: z.string().datetime().nullable(),
};

// Fields the repository fills in; callers never provide them.
const SYNC_OMIT = {
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
} as const;

// --- Enums ------------------------------------------------------------------

export const goalHorizonSchema = z.enum(["north_star", "long_term", "quarter"]);
export const goalStatusSchema = z.enum(["active", "achieved", "paused", "dropped"]);
export const projectStatusSchema = z.enum(["active", "done", "paused"]);
export const projectTypeSchema = z.enum(["personal", "business", "research"]);
export const milestoneStatusSchema = z.enum(["planned", "hit", "missed"]);
export const taskStatusSchema = z.enum(["todo", "doing", "done"]);
export const sourceKindSchema = z.enum([
  "paper",
  "article",
  "book",
  "dataset",
  "web",
  "other",
]);
export const sourceStatusSchema = z.enum(["to_read", "reading", "read"]);

export type GoalHorizon = z.infer<typeof goalHorizonSchema>;
export type GoalStatus = z.infer<typeof goalStatusSchema>;
export type ProjectStatus = z.infer<typeof projectStatusSchema>;
export type ProjectType = z.infer<typeof projectTypeSchema>;
export type MilestoneStatus = z.infer<typeof milestoneStatusSchema>;
export type TaskStatus = z.infer<typeof taskStatusSchema>;
export type SourceKind = z.infer<typeof sourceKindSchema>;
export type SourceStatus = z.infer<typeof sourceStatusSchema>;

// --- Goal -------------------------------------------------------------------

// Goals form a strict 3-level tree (north_star -> long_term -> quarter). The
// root-vs-child rule is enforced here at parse time; the full parent/child
// horizon pairing is enforced in GoalRepository (it needs to read the parent).
const goalParentRefine = (
  goal: { horizon: GoalHorizon; parentId: string | null },
  ctx: z.RefinementCtx,
) => {
  const isRoot = goal.horizon === "north_star";
  if (isRoot && goal.parentId !== null) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["parentId"],
      message: "A north star goal must be a root (parentId must be null)",
    });
  }
  if (!isRoot && goal.parentId === null) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["parentId"],
      message: `A ${goal.horizon} goal requires a parent`,
    });
  }
};

const goalObject = z.object({
  ...syncFields,
  parentId: z.string().uuid().nullable(),
  title: z.string().min(1),
  description: z.string().optional(),
  horizon: goalHorizonSchema,
  status: goalStatusSchema,
  targetMetric: z.string().optional(),
  dueDate: z.string().date().optional(),
  sortOrder: z.number(),
});

export const goalSchema = goalObject.superRefine(goalParentRefine);
export const goalInputSchema = goalObject.omit(SYNC_OMIT).superRefine(goalParentRefine);

export type Goal = z.infer<typeof goalSchema>;
// `z.input` (not `z.infer`): defaulted fields are optional for callers.
export type GoalInput = z.input<typeof goalInputSchema>;

// --- Project ----------------------------------------------------------------

const projectObject = z.object({
  ...syncFields,
  goalId: z.string().uuid().nullable().default(null),
  title: z.string().min(1),
  description: z.string().optional(),
  status: projectStatusSchema,
  type: projectTypeSchema.default("personal"),
});

export const projectSchema = projectObject;
export const projectInputSchema = projectObject.omit(SYNC_OMIT);

export type Project = z.infer<typeof projectSchema>;
export type ProjectInput = z.input<typeof projectInputSchema>;

// --- Milestone --------------------------------------------------------------

const milestoneObject = z.object({
  ...syncFields,
  projectId: z.string().uuid(),
  title: z.string().min(1),
  date: z.string().date(),
  status: milestoneStatusSchema,
});

export const milestoneSchema = milestoneObject;
export const milestoneInputSchema = milestoneObject.omit(SYNC_OMIT);

export type Milestone = z.infer<typeof milestoneSchema>;
export type MilestoneInput = z.input<typeof milestoneInputSchema>;

// --- Task -------------------------------------------------------------------

const taskObject = z.object({
  ...syncFields,
  goalId: z.string().uuid().nullable().default(null),
  projectId: z.string().uuid().nullable().default(null),
  title: z.string().min(1),
  notes: z.string().optional(),
  status: taskStatusSchema,
  dueDate: z.string().date().optional(),
  sortOrder: z.number(),
});

export const taskSchema = taskObject;
export const taskInputSchema = taskObject.omit(SYNC_OMIT);

export type Task = z.infer<typeof taskSchema>;
export type TaskInput = z.input<typeof taskInputSchema>;

// --- ReviewEntry ------------------------------------------------------------

const reviewEntryObject = z.object({
  ...syncFields,
  weekStart: z.string().date(),
  wins: z.string(),
  blockers: z.string(),
  lessons: z.string(),
  nextFocus: z.string(),
});

export const reviewEntrySchema = reviewEntryObject;
export const reviewEntryInputSchema = reviewEntryObject.omit(SYNC_OMIT);

export type ReviewEntry = z.infer<typeof reviewEntrySchema>;
export type ReviewEntryInput = z.input<typeof reviewEntryInputSchema>;

// --- Source (research reading list / references) ----------------------------

const sourceObject = z.object({
  ...syncFields,
  projectId: z.string().uuid(),
  title: z.string().min(1),
  url: z.string().optional(),
  authors: z.string().optional(),
  kind: sourceKindSchema.default("article"),
  status: sourceStatusSchema.default("to_read"),
  notes: z.string().optional(),
});

export const sourceSchema = sourceObject;
export const sourceInputSchema = sourceObject.omit(SYNC_OMIT);

export type Source = z.infer<typeof sourceSchema>;
export type SourceInput = z.input<typeof sourceInputSchema>;
