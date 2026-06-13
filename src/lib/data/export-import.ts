import { z } from "zod";
import { db } from "./dexie/db";
import {
  goalSchema,
  milestoneSchema,
  projectSchema,
  reviewEntrySchema,
  taskSchema,
} from "./schemas";

/**
 * Versioned, whole-database JSON snapshot. Export/import must round-trip
 * losslessly (Architecture rule 5): the snapshot includes soft-deleted rows,
 * and import validates with Zod before replacing local state.
 */
export const EXPORT_VERSION = 1 as const;

export const exportFileSchema = z.object({
  version: z.literal(EXPORT_VERSION),
  exportedAt: z.string().datetime(),
  data: z.object({
    goals: z.array(goalSchema),
    projects: z.array(projectSchema),
    milestones: z.array(milestoneSchema),
    tasks: z.array(taskSchema),
    reviews: z.array(reviewEntrySchema),
  }),
});

export type ExportFile = z.infer<typeof exportFileSchema>;

export async function exportDatabase(): Promise<ExportFile> {
  const [goals, projects, milestones, tasks, reviews] = await Promise.all([
    db.goals.toArray(),
    db.projects.toArray(),
    db.milestones.toArray(),
    db.tasks.toArray(),
    db.reviews.toArray(),
  ]);
  return {
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    data: { goals, projects, milestones, tasks, reviews },
  };
}

export async function importDatabase(raw: unknown): Promise<void> {
  const snapshot = exportFileSchema.parse(raw);
  await db.transaction(
    "rw",
    [db.goals, db.projects, db.milestones, db.tasks, db.reviews],
    async () => {
      await Promise.all([
        db.goals.clear(),
        db.projects.clear(),
        db.milestones.clear(),
        db.tasks.clear(),
        db.reviews.clear(),
      ]);
      await Promise.all([
        db.goals.bulkAdd(snapshot.data.goals),
        db.projects.bulkAdd(snapshot.data.projects),
        db.milestones.bulkAdd(snapshot.data.milestones),
        db.tasks.bulkAdd(snapshot.data.tasks),
        db.reviews.bulkAdd(snapshot.data.reviews),
      ]);
    },
  );
}

export async function exportDatabaseToJson(): Promise<string> {
  return JSON.stringify(await exportDatabase(), null, 2);
}

export async function importDatabaseFromJson(json: string): Promise<void> {
  return importDatabase(JSON.parse(json));
}
