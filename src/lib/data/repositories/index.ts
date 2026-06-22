import type {
  CalendarEvent,
  CalendarEventInput,
  Goal,
  GoalHorizon,
  GoalInput,
  Milestone,
  MilestoneInput,
  Project,
  ProjectInput,
  ReviewEntry,
  ReviewEntryInput,
  Source,
  SourceInput,
  Task,
  TaskInput,
  TaskStatus,
} from "../schemas";

/**
 * The persistence contract. UI components and hooks depend on these
 * interfaces (and the instances exported from `lib/data`), never on Dexie.
 * Swapping Dexie for a sync engine later only touches `lib/data/dexie`.
 */
export interface Repository<T, TInput> {
  /** Active (non soft-deleted) records. */
  list(): Promise<T[]>;
  /** A single active record, or undefined if missing or soft-deleted. */
  get(id: string): Promise<T | undefined>;
  /** Validate, stamp sync fields, and insert. */
  create(input: TInput): Promise<T>;
  /** Patch an active record and bump `updatedAt`. */
  update(id: string, patch: Partial<TInput>): Promise<T>;
  /** Soft delete: set `deletedAt`, never remove the row. */
  remove(id: string): Promise<void>;
}

export interface GoalRepository extends Repository<Goal, GoalInput> {
  listByParent(parentId: string | null): Promise<Goal[]>;
  listByHorizon(horizon: GoalHorizon): Promise<Goal[]>;
}

export interface ProjectRepository extends Repository<Project, ProjectInput> {
  listByGoal(goalId: string): Promise<Project[]>;
}

export interface MilestoneRepository extends Repository<Milestone, MilestoneInput> {
  listByProject(projectId: string): Promise<Milestone[]>;
}

export interface TaskRepository extends Repository<Task, TaskInput> {
  listByStatus(status: TaskStatus): Promise<Task[]>;
  listByProject(projectId: string): Promise<Task[]>;
}

export interface ReviewRepository extends Repository<ReviewEntry, ReviewEntryInput> {
  getByWeek(weekStart: string): Promise<ReviewEntry | undefined>;
}

export interface SourceRepository extends Repository<Source, SourceInput> {
  listByProject(projectId: string): Promise<Source[]>;
}

export interface EventRepository
  extends Repository<CalendarEvent, CalendarEventInput> {
  listByProject(projectId: string): Promise<CalendarEvent[]>;
}
