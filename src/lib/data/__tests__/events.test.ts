import { beforeEach, describe, expect, it } from "vitest";
import { fromZonedTime, toZonedTime } from "date-fns-tz";
import { format } from "date-fns";
import { db } from "../dexie/db";
import { eventRepository, projectRepository } from "../index";

beforeEach(async () => {
  await Promise.all(db.tables.map((table) => table.clear()));
});

describe("EventRepository", () => {
  it("stores events with defaults and lists by project", async () => {
    const project = await projectRepository.create({
      title: "P",
      status: "active",
      type: "personal",
    });

    const start = fromZonedTime(
      "2026-07-01T09:00:00",
      "America/New_York",
    ).toISOString();
    const event = await eventRepository.create({
      title: "Standup",
      start,
      timeZone: "America/New_York",
      projectId: project.id,
    });

    expect(event.allDay).toBe(false); // schema default
    expect(event.timeZone).toBe("America/New_York");
    expect(await eventRepository.listByProject(project.id)).toHaveLength(1);

    await eventRepository.remove(event.id);
    expect(await eventRepository.listByProject(project.id)).toHaveLength(0);
  });

  it("round-trips a wall time through a time zone (DST-aware)", async () => {
    // 9:00 wall time in New York on a summer (EDT, UTC-4) date is 13:00 UTC.
    const utc = fromZonedTime("2026-07-01T09:00:00", "America/New_York");
    expect(utc.toISOString()).toBe("2026-07-01T13:00:00.000Z");

    // ...and converting back renders 09:00 in that zone.
    const backToNy = toZonedTime(utc, "America/New_York");
    expect(format(backToNy, "HH:mm")).toBe("09:00");

    // The same instant is 18:00 in London (BST, UTC+1).
    const inLondon = toZonedTime(utc, "Europe/London");
    expect(format(inLondon, "HH:mm")).toBe("14:00");
  });
});
