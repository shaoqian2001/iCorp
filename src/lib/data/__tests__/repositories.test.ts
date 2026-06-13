import { beforeEach, describe, expect, it } from "vitest";
import { db } from "../dexie/db";
import { goalRepository, taskRepository } from "../index";

beforeEach(async () => {
  await Promise.all(db.tables.map((table) => table.clear()));
});

describe("DexieRepository: sync fields and soft delete", () => {
  it("stamps sync fields on create", async () => {
    const task = await taskRepository.create({
      title: "Write the data layer",
      status: "todo",
      sortOrder: 0,
    });

    expect(task.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(task.userId).toBe("local");
    expect(task.deletedAt).toBeNull();
    expect(task.createdAt).toBe(task.updatedAt);
    // optional FKs default to null so rows have a consistent shape
    expect(task.goalId).toBeNull();
    expect(task.projectId).toBeNull();
  });

  it("soft-deletes: hidden from queries but the row survives", async () => {
    const task = await taskRepository.create({
      title: "Disposable",
      status: "todo",
      sortOrder: 0,
    });

    await taskRepository.remove(task.id);

    expect(await taskRepository.get(task.id)).toBeUndefined();
    expect(await taskRepository.list()).toHaveLength(0);
    // physically still present with deletedAt set
    expect(await db.tasks.count()).toBe(1);
    const raw = await db.tasks.get(task.id);
    expect(raw?.deletedAt).not.toBeNull();
  });

  it("bumps updatedAt on update", async () => {
    const task = await taskRepository.create({
      title: "Move me",
      status: "todo",
      sortOrder: 0,
    });

    const updated = await taskRepository.update(task.id, { status: "doing" });

    expect(updated.status).toBe("doing");
    expect(new Date(updated.updatedAt).getTime()).toBeGreaterThanOrEqual(
      new Date(task.updatedAt).getTime(),
    );
    expect(updated.createdAt).toBe(task.createdAt);
  });

  it("rejects invalid input at the schema boundary", async () => {
    await expect(
      // empty title violates z.string().min(1)
      taskRepository.create({ title: "", status: "todo", sortOrder: 0 }),
    ).rejects.toThrow();
  });
});

describe("GoalRepository: 3-level tree enforcement", () => {
  it("accepts a valid north_star -> long_term -> quarter chain", async () => {
    const northStar = await goalRepository.create({
      parentId: null,
      title: "Become a self-sufficient solo operator",
      horizon: "north_star",
      status: "active",
      sortOrder: 0,
    });
    const longTerm = await goalRepository.create({
      parentId: northStar.id,
      title: "Ship a profitable product in 2 years",
      horizon: "long_term",
      status: "active",
      sortOrder: 0,
    });
    const quarter = await goalRepository.create({
      parentId: longTerm.id,
      title: "Launch the MVP this quarter",
      horizon: "quarter",
      status: "active",
      sortOrder: 0,
    });

    expect(quarter.parentId).toBe(longTerm.id);
    expect(await goalRepository.listByParent(northStar.id)).toHaveLength(1);
    expect(await goalRepository.listByHorizon("quarter")).toHaveLength(1);
  });

  it("rejects structures that break the 3-level rule", async () => {
    const northStar = await goalRepository.create({
      parentId: null,
      title: "Root",
      horizon: "north_star",
      status: "active",
      sortOrder: 0,
    });

    // north_star with a parent
    await expect(
      goalRepository.create({
        parentId: northStar.id,
        title: "Bad root",
        horizon: "north_star",
        status: "active",
        sortOrder: 0,
      }),
    ).rejects.toThrow();

    // quarter hanging directly off a north_star (skips long_term)
    await expect(
      goalRepository.create({
        parentId: northStar.id,
        title: "Skipped a level",
        horizon: "quarter",
        status: "active",
        sortOrder: 0,
      }),
    ).rejects.toThrow();

    // long_term with no parent
    await expect(
      goalRepository.create({
        parentId: null,
        title: "Orphan",
        horizon: "long_term",
        status: "active",
        sortOrder: 0,
      }),
    ).rejects.toThrow();
  });
});
