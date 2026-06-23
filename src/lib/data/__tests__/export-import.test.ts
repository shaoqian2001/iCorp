import { beforeEach, describe, expect, it } from "vitest";
import { db } from "../dexie/db";
import {
  eventRepository,
  exportDatabase,
  goalRepository,
  importDatabase,
  milestoneRepository,
  projectRepository,
  reviewRepository,
  sourceRepository,
  taskRepository,
} from "../index";

beforeEach(async () => {
  await Promise.all(db.tables.map((table) => table.clear()));
});

async function seedSample(): Promise<void> {
  const northStar = await goalRepository.create({
    parentId: null,
    title: "North star",
    horizon: "north_star",
    status: "active",
    sortOrder: 0,
  });
  const project = await projectRepository.create({
    goalId: northStar.id,
    title: "Project",
    status: "active",
    type: "research",
  });
  await sourceRepository.create({
    projectId: project.id,
    title: "A source",
    kind: "paper",
    status: "reading",
  });
  await eventRepository.create({
    projectId: project.id,
    title: "Kickoff call",
    start: "2026-07-01T13:00:00.000Z",
    timeZone: "America/New_York",
  });
  await milestoneRepository.create({
    projectId: project.id,
    title: "Milestone",
    date: "2026-07-01",
    status: "planned",
  });
  const task = await taskRepository.create({
    projectId: project.id,
    title: "A task",
    status: "todo",
    sortOrder: 0,
  });
  // a soft-deleted row must survive the round-trip too
  await taskRepository.remove(task.id);
  await reviewRepository.create({
    weekStart: "2026-06-08",
    wins: "Shipped",
    blockers: "None",
    lessons: "Tests pay off",
    nextFocus: "Roadmap",
  });
}

describe("export/import", () => {
  it("round-trips the full database losslessly through JSON", async () => {
    await seedSample();
    const before = await exportDatabase();
    const serialized = JSON.stringify(before);

    // wipe everything
    await Promise.all(db.tables.map((table) => table.clear()));
    expect((await exportDatabase()).data.goals).toHaveLength(0);

    await importDatabase(JSON.parse(serialized));
    const after = await exportDatabase();

    expect(after.data).toEqual(before.data);
    // soft-deleted task preserved
    expect(after.data.tasks).toHaveLength(1);
    expect(after.data.tasks[0]?.deletedAt).not.toBeNull();
  });

  it("rejects a malformed snapshot", async () => {
    await expect(
      importDatabase({ version: 1, data: { goals: [{ nope: true }] } }),
    ).rejects.toThrow();
  });
});
