import {
  DexieGoalRepository,
  DexieMilestoneRepository,
  DexieProjectRepository,
  DexieReviewRepository,
  DexieSourceRepository,
  DexieTaskRepository,
} from "./dexie/repositories";
import type {
  GoalRepository,
  MilestoneRepository,
  ProjectRepository,
  ReviewRepository,
  SourceRepository,
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
export const sourceRepository: SourceRepository = new DexieSourceRepository();

export * from "./schemas";
export type {
  Repository,
  GoalRepository,
  MilestoneRepository,
  ProjectRepository,
  ReviewRepository,
  SourceRepository,
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
export {
  ensureSeeded,
  isDatabaseEmpty,
  resetAndReseed,
  seedDatabase,
} from "./seed";
