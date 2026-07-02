// Client-only preferences for cloud sync (localStorage).

const AUTO_BACKUP = "solo-studio:cloud-autobackup";
const LAST_SYNCED = "solo-studio:cloud-last-synced";

export function getAutoBackup(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(AUTO_BACKUP) === "true";
}

export function setAutoBackup(enabled: boolean): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(AUTO_BACKUP, enabled ? "true" : "false");
}

export function getLastSynced(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(LAST_SYNCED);
}

export function setLastSynced(iso: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LAST_SYNCED, iso);
}
