import {
  DexieGoalRepository,
  DexieMilestoneRepository,
  DexieProjectRepository,
  DexieReviewRepository,
  DexieTaskRepository,
} from "./dexie/repositories";
import type {
  GoalRepository,
  MilestoneRepository,
  ProjectRepository,
  ReviewRepository,
  TaskRepository,
} from "./repositories";

/**
 * Composition root for the data layer. UI components and hooks import the
 * repository instances, schemas, and types from here — never from `./dexie`.
 */
export const goalRepository: GoalRepository = new DexieGoalRepository();
export const projectRepository: ProjectRepository = new DexieProjectRepository();
export const milestoneRepository: MilestoneRepository =
  new DexieMilestoneRepository();
export const taskRepository: TaskRepository = new DexieTaskRepository();
export const reviewRepository: ReviewRepository = new DexieReviewRepository();

export * from "./schemas";
export type {
  Repository,
  GoalRepository,
  MilestoneRepository,
  ProjectRepository,
  ReviewRepository,
  TaskRepository,
} from "./repositories";
export {
  EXPORT_VERSION,
  exportDatabase,
  exportDatabaseToJson,
  importDatabase,
  importDatabaseFromJson,
} from "./export-import";
export type { ExportFile } from "./export-import";
