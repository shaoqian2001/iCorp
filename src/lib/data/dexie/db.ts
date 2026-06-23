import Dexie, { type Table } from "dexie";
import type {
  CalendarEvent,
  Goal,
  Milestone,
  Project,
  ReviewEntry,
  Source,
  Task,
} from "../schemas";

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
  sources!: Table<Source, string>;
  events!: Table<CalendarEvent, string>;

  constructor() {
    super("solo-studio");
    this.version(1).stores({
      goals: "id, parentId, horizon, status, sortOrder",
      projects: "id, goalId, status",
      milestones: "id, projectId, date, status",
      tasks: "id, goalId, projectId, status, dueDate, sortOrder",
      reviews: "id, weekStart",
    });
    // v2: project types + the research Sources table.
    this.version(2)
      .stores({
        goals: "id, parentId, horizon, status, sortOrder",
        projects: "id, goalId, status, type",
        milestones: "id, projectId, date, status",
        tasks: "id, goalId, projectId, status, dueDate, sortOrder",
        reviews: "id, weekStart",
        sources: "id, projectId, status, kind",
      })
      .upgrade(async (tx) => {
        await tx
          .table("projects")
          .toCollection()
          .modify((project: Partial<Project>) => {
            if (project.type === undefined) project.type = "personal";
          });
      });
    // v3: calendar events (new table; existing tables carry forward).
    this.version(3).stores({
      events: "id, start, projectId",
    });
  }
}

export const db = new SoloStudioDB();
