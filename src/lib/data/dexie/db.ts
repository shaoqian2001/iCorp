import Dexie, { type Table } from "dexie";
import type { Goal, Milestone, Project, ReviewEntry, Task } from "../schemas";

/**
 * The IndexedDB schema. This is the ONLY module that talks to Dexie's table
 * primitives; everything else goes through the repositories. Soft-delete
 * filtering happens in the repositories (Dexie skips null keys, so `deletedAt`
 * is intentionally not indexed).
 */
export class SoloStudioDB extends Dexie {
  goals!: Table<Goal, string>;
  projects!: Table<Project, string>;
  milestones!: Table<Milestone, string>;
  tasks!: Table<Task, string>;
  reviews!: Table<ReviewEntry, string>;

  constructor() {
    super("solo-studio");
    this.version(1).stores({
      goals: "id, parentId, horizon, status, sortOrder",
      projects: "id, goalId, status",
      milestones: "id, projectId, date, status",
      tasks: "id, goalId, projectId, status, dueDate, sortOrder",
      reviews: "id, weekStart",
    });
  }
}

export const db = new SoloStudioDB();
