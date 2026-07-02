import { exportDatabase, importDatabase } from "@/lib/data";
import { setLastSynced } from "./prefs";

async function readError(response: Response): Promise<string> {
  const data = (await response.json().catch(() => null)) as
    | { error?: string }
    | null;
  return data?.error ?? `Request failed (${response.status}).`;
}

/** Push the full local workspace to the cloud for the signed-in user. */
export async function backupToCloud(): Promise<string> {
  const snapshot = await exportDatabase();
  const response = await fetch("/api/workspace", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(snapshot),
  });
  if (!response.ok) throw new Error(await readError(response));
  const { updatedAt } = (await response.json()) as { updatedAt: string };
  setLastSynced(updatedAt);
  return updatedAt;
}

/** Pull the cloud snapshot and replace local state. Returns null if none. */
export async function restoreFromCloud(): Promise<string | null> {
  const response = await fetch("/api/workspace");
  if (!response.ok) throw new Error(await readError(response));
  const { data, updatedAt } = (await response.json()) as {
    data: unknown;
    updatedAt: string | null;
  };
  if (!data) return null;
  await importDatabase(data);
  if (updatedAt) setLastSynced(updatedAt);
  return updatedAt;
}
