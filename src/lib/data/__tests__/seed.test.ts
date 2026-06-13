import { beforeEach, describe, expect, it } from "vitest";
import { db } from "../dexie/db";
import { ensureSeeded, exportDatabase, isDatabaseEmpty } from "../index";

beforeEach(async () => {
  await Promise.all(db.tables.map((table) => table.clear()));
});

describe("seed", () => {
  it("seeds a fresh database and is idempotent", async () => {
    expect(await isDatabaseEmpty()).toBe(true);
    expect(await ensureSeeded()).toBe(true);

    const seeded = (await exportDatabase()).data;
    // every entity type is represented so the demo shows every feature
    expect(seeded.goals.length).toBeGreaterThan(0);
    expect(seeded.projects.length).toBeGreaterThan(0);
    expect(seeded.milestones.length).toBeGreaterThan(0);
    expect(seeded.tasks.length).toBeGreaterThan(0);
    expect(seeded.reviews.length).toBeGreaterThan(0);

    // a second run is a no-op
    expect(await ensureSeeded()).toBe(false);
    const after = (await exportDatabase()).data;
    expect(after.goals.length).toBe(seeded.goals.length);
    expect(after.tasks.length).toBe(seeded.tasks.length);
  });

  it("covers all three goal horizons and tasks in every column", async () => {
    await ensureSeeded();
    const { goals, tasks } = (await exportDatabase()).data;

    const horizons = new Set(goals.map((goal) => goal.horizon));
    expect(horizons).toEqual(new Set(["north_star", "long_term", "quarter"]));

    // exactly one root, and it is the north star
    const roots = goals.filter((goal) => goal.parentId === null);
    expect(roots).toHaveLength(1);
    expect(roots[0]?.horizon).toBe("north_star");

    const statuses = new Set(tasks.map((task) => task.status));
    expect(statuses).toEqual(new Set(["todo", "doing", "done"]));
  });
});
