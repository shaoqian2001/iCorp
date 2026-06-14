import { beforeEach, describe, expect, it } from "vitest";
import { db } from "../dexie/db";
import { projectRepository, sourceRepository } from "../index";

beforeEach(async () => {
  await Promise.all(db.tables.map((table) => table.clear()));
});

describe("SourceRepository", () => {
  it("applies kind/status defaults and lists by project", async () => {
    const project = await projectRepository.create({
      title: "Research project",
      status: "active",
      type: "research",
    });

    const source = await sourceRepository.create({
      projectId: project.id,
      title: "A useful paper",
    });
    // defaults from the schema
    expect(source.kind).toBe("article");
    expect(source.status).toBe("to_read");

    await sourceRepository.create({
      projectId: project.id,
      title: "Another reference",
      kind: "book",
      status: "read",
    });

    const forProject = await sourceRepository.listByProject(project.id);
    expect(forProject).toHaveLength(2);

    // unrelated project's sources are excluded
    const other = await projectRepository.create({
      title: "Other",
      status: "active",
      type: "personal",
    });
    expect(await sourceRepository.listByProject(other.id)).toHaveLength(0);
  });

  it("updates status and soft-deletes", async () => {
    const project = await projectRepository.create({
      title: "P",
      status: "active",
      type: "research",
    });
    const source = await sourceRepository.create({
      projectId: project.id,
      title: "Read me",
    });

    const updated = await sourceRepository.update(source.id, { status: "read" });
    expect(updated.status).toBe("read");

    await sourceRepository.remove(source.id);
    expect(await sourceRepository.listByProject(project.id)).toHaveLength(0);
  });
});

describe("Project type", () => {
  it("defaults to personal when omitted", async () => {
    const project = await projectRepository.create({
      title: "Untyped",
      status: "active",
    });
    expect(project.type).toBe("personal");
  });
});
