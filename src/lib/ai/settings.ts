// BYO Anthropic API key + model preference. Stored in localStorage (NOT Dexie)
// so the key is never part of the JSON export and never leaves this browser
// except to the app's own localhost proxy route.

const KEY_STORAGE = "solo-studio:anthropic-key";
const MODEL_STORAGE = "solo-studio:anthropic-model";

export const DEFAULT_MODEL = "claude-opus-4-8";

export interface ModelOption {
  id: string;
  label: string;
}

export const MODEL_OPTIONS: ModelOption[] = [
  { id: "claude-opus-4-8", label: "Claude Opus 4.8 — most capable" },
  { id: "claude-sonnet-4-6", label: "Claude Sonnet 4.6 — balanced" },
  { id: "claude-haiku-4-5", label: "Claude Haiku 4.5 — fastest, cheapest" },
];

export function getApiKey(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(KEY_STORAGE) ?? "";
}

export function setApiKey(value: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY_STORAGE, value);
}

export function clearApiKey(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY_STORAGE);
}

export function getModel(): string {
  if (typeof window === "undefined") return DEFAULT_MODEL;
  return window.localStorage.getItem(MODEL_STORAGE) ?? DEFAULT_MODEL;
}

export function setModel(value: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(MODEL_STORAGE, value);
}
