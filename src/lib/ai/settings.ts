// BYO key for either Anthropic (direct) or an OpenAI-compatible provider such
// as OpenRouter. Keys/models are stored per provider in localStorage (never in
// Dexie, so they're never part of the JSON export).

export type Provider = "anthropic" | "openrouter";

export const DEFAULT_PROVIDER: Provider = "anthropic";

export interface ProviderInfo {
  id: Provider;
  label: string;
  keyHint: string;
  keysUrl: string;
  /** OpenRouter exposes hundreds of models, so its model field is free text. */
  freeformModel: boolean;
}

export const PROVIDERS: ProviderInfo[] = [
  {
    id: "anthropic",
    label: "Anthropic (Claude)",
    keyHint: "sk-ant-…",
    keysUrl: "https://console.anthropic.com/settings/keys",
    freeformModel: false,
  },
  {
    id: "openrouter",
    label: "OpenRouter",
    keyHint: "sk-or-…",
    keysUrl: "https://openrouter.ai/keys",
    freeformModel: true,
  },
];

export interface ModelOption {
  id: string;
  label: string;
}

export const PROVIDER_MODELS: Record<Provider, ModelOption[]> = {
  anthropic: [
    { id: "claude-opus-4-8", label: "Claude Opus 4.8 — most capable" },
    { id: "claude-sonnet-4-6", label: "Claude Sonnet 4.6 — balanced" },
    { id: "claude-haiku-4-5", label: "Claude Haiku 4.5 — fastest, cheapest" },
  ],
  // Suggestions only — OpenRouter accepts any model id from openrouter.ai/models.
  openrouter: [
    { id: "anthropic/claude-3.5-sonnet", label: "Claude 3.5 Sonnet" },
    { id: "openai/gpt-4o-mini", label: "GPT-4o mini" },
    { id: "openai/gpt-4o", label: "GPT-4o" },
    { id: "google/gemini-flash-1.5", label: "Gemini 1.5 Flash" },
    { id: "meta-llama/llama-3.1-70b-instruct", label: "Llama 3.1 70B" },
  ],
};

export const PROVIDER_DEFAULT_MODEL: Record<Provider, string> = {
  anthropic: "claude-opus-4-8",
  openrouter: "anthropic/claude-3.5-sonnet",
};

const PROVIDER_STORAGE = "solo-studio:ai-provider";

function keyStorage(provider: Provider): string {
  return provider === "anthropic"
    ? "solo-studio:anthropic-key"
    : "solo-studio:openrouter-key";
}

function modelStorage(provider: Provider): string {
  return provider === "anthropic"
    ? "solo-studio:anthropic-model"
    : "solo-studio:openrouter-model";
}

export function getProvider(): Provider {
  if (typeof window === "undefined") return DEFAULT_PROVIDER;
  const value = window.localStorage.getItem(PROVIDER_STORAGE);
  return value === "openrouter" || value === "anthropic"
    ? value
    : DEFAULT_PROVIDER;
}

export function setProvider(provider: Provider): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PROVIDER_STORAGE, provider);
}

export function getApiKey(provider: Provider): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(keyStorage(provider)) ?? "";
}

export function setApiKey(provider: Provider, value: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(keyStorage(provider), value);
}

export function clearApiKey(provider: Provider): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(keyStorage(provider));
}

export function getModel(provider: Provider): string {
  if (typeof window === "undefined") return PROVIDER_DEFAULT_MODEL[provider];
  return (
    window.localStorage.getItem(modelStorage(provider)) ??
    PROVIDER_DEFAULT_MODEL[provider]
  );
}

export function setModel(provider: Provider, value: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(modelStorage(provider), value);
}
