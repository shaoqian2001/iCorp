import type { Table } from "dexie";
import type { z } from "zod";
import type { Repository } from "../repositories";

/** Sync-ready fields every record carries (Architecture rule 2). */
export interface BaseRecord {
  id: string;
  userId: "local";
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

const nowIso = () => new Date().toISOString();

/**
 * Generic Dexie-backed repository implementing soft-deletes, sync-field
 * stamping, and Zod validation on every write. Entity repositories extend
 * this and add their domain queries.
 */
export class DexieRepository<T extends BaseRecord, TInput>
  implements Repository<T, TInput>
{
  constructor(
    protected readonly table: Table<T, string>,
    protected readonly inputSchema: z.ZodTypeAny,
    protected readonly recordSchema: z.ZodTypeAny,
  ) {}

  async list(): Promise<T[]> {
    const all = await this.table.toArray();
    return all.filter((row) => row.deletedAt === null);
  }

  async get(id: string): Promise<T | undefined> {
    const row = await this.table.get(id);
    return row && row.deletedAt === null ? row : undefined;
  }

  async create(input: TInput): Promise<T> {
    const data = this.inputSchema.parse(input);
    const ts = nowIso();
    const record = this.recordSchema.parse({
      ...data,
      id: crypto.randomUUID(),
      userId: "local",
      createdAt: ts,
      updatedAt: ts,
      deletedAt: null,
    }) as T;
    await this.table.add(record);
    return record;
  }

  async update(id: string, patch: Partial<TInput>): Promise<T> {
    const existing = await this.requireActive(id);
    const record = this.recordSchema.parse({
      ...existing,
      ...patch,
      updatedAt: nowIso(),
    }) as T;
    await this.table.put(record);
    return record;
  }

  async remove(id: string): Promise<void> {
    const row = await this.table.get(id);
    if (!row || row.deletedAt !== null) return;
    const ts = nowIso();
    await this.table.put({ ...row, deletedAt: ts, updatedAt: ts });
  }

  protected async requireActive(id: string): Promise<T> {
    const row = await this.get(id);
    if (!row) throw new Error(`Record ${id} not found`);
    return row;
  }
}
