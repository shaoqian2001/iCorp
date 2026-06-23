import { db } from "./db";
import { DexieRepository } from "./base-repository";
import {
  eventInputSchema,
  eventSchema,
  goalInputSchema,
  goalSchema,
  milestoneInputSchema,
  milestoneSchema,
  projectInputSchema,
  projectSchema,
  reviewEntryInputSchema,
  reviewEntrySchema,
  sourceInputSchema,
  sourceSchema,
  taskInputSchema,
  taskSchema,
} from "../schemas";
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
import type {
  EventRepository,
  GoalRepository,
  MilestoneRepository,
  ProjectRepository,
  ReviewRepository,
  SourceRepository,
  TaskRepository,
} from "../repositories";

export class DexieGoalRepository
  extends DexieRepository<Goal, GoalInput>
  implements GoalRepository
{
  constructor() {
    super(db.goals, goalInputSchema, goalSchema);
  }

  async create(input: GoalInput): Promise<Goal> {
    await this.assertValidParent(input.horizon, input.parentId);
    return super.create(input);
  }

  async update(id: string, patch: Partial<GoalInput>): Promise<Goal> {
    const existing = await this.requireActive(id);
    const horizon = patch.horizon ?? existing.horizon;
    const parentId =
      patch.parentId !== undefined ? patch.parentId : existing.parentId;
    await this.assertValidParent(horizon, parentId, id);
    return super.update(id, patch);
  }

  listByParent(parentId: string | null): Promise<Goal[]> {
    return this.list().then((goals) =>
      goals.filter((goal) => goal.parentId === parentId),
    );
  }

  listByHorizon(horizon: GoalHorizon): Promise<Goal[]> {
    return this.list().then((goals) =>
      goals.filter((goal) => goal.horizon === horizon),
    );
  }

  /** Enforces the exact 3-level north_star -> long_term -> quarter chain. */
  private async assertValidParent(
    horizon: GoalHorizon,
    parentId: string | null,
    selfId?: string,
  ): Promise<void> {
    if (horizon === "north_star") {
      if (parentId !== null) {
        throw new Error("A north star goal cannot have a parent");
      }
      return;
    }
    if (parentId === null) {
      throw new Error(`A ${horizon} goal requires a parent`);
    }
    if (parentId === selfId) {
      throw new Error("A goal cannot be its own parent");
    }
    const parent = await this.get(parentId);
    if (!parent) {
      throw new Error(`Parent goal ${parentId} not found`);
    }
    const expectedParent: GoalHorizon =
      horizon === "long_term" ? "north_star" : "long_term";
    if (parent.horizon !== expectedParent) {
      throw new Error(
        `A ${horizon} goal must hang off a ${expectedParent} goal, not a ${parent.horizon} goal`,
      );
    }
  }
}

export class DexieProjectRepository
  extends DexieRepository<Project, ProjectInput>
  implements ProjectRepository
{
  constructor() {
    super(db.projects, projectInputSchema, projectSchema);
  }

  listByGoal(goalId: string): Promise<Project[]> {
    return this.list().then((projects) =>
      projects.filter((project) => project.goalId === goalId),
    );
  }
}

export class DexieMilestoneRepository
  extends DexieRepository<Milestone, MilestoneInput>
  implements MilestoneRepository
{
  constructor() {
    super(db.milestones, milestoneInputSchema, milestoneSchema);
  }

  listByProject(projectId: string): Promise<Milestone[]> {
    return this.list().then((milestones) =>
      milestones.filter((milestone) => milestone.projectId === projectId),
    );
  }
}

export class DexieTaskRepository
  extends DexieRepository<Task, TaskInput>
  implements TaskRepository
{
  constructor() {
    super(db.tasks, taskInputSchema, taskSchema);
  }

  listByStatus(status: TaskStatus): Promise<Task[]> {
    return this.list().then((tasks) =>
      tasks.filter((task) => task.status === status),
    );
  }

  listByProject(projectId: string): Promise<Task[]> {
    return this.list().then((tasks) =>
      tasks.filter((task) => task.projectId === projectId),
    );
  }
}

export class DexieReviewRepository
  extends DexieRepository<ReviewEntry, ReviewEntryInput>
  implements ReviewRepository
{
  constructor() {
    super(db.reviews, reviewEntryInputSchema, reviewEntrySchema);
  }

  getByWeek(weekStart: string): Promise<ReviewEntry | undefined> {
    return this.list().then((entries) =>
      entries.find((entry) => entry.weekStart === weekStart),
    );
  }
}

export class DexieSourceRepository
  extends DexieRepository<Source, SourceInput>
  implements SourceRepository
{
  constructor() {
    super(db.sources, sourceInputSchema, sourceSchema);
  }

  listByProject(projectId: string): Promise<Source[]> {
    return this.list().then((sources) =>
      sources.filter((source) => source.projectId === projectId),
    );
  }
}

export class DexieEventRepository
  extends DexieRepository<CalendarEvent, CalendarEventInput>
  implements EventRepository
{
  constructor() {
    super(db.events, eventInputSchema, eventSchema);
  }

  listByProject(projectId: string): Promise<CalendarEvent[]> {
    return this.list().then((events) =>
      events.filter((event) => event.projectId === projectId),
    );
  }
}
