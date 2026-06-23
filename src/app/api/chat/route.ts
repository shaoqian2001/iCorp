import Anthropic from "@anthropic-ai/sdk";

// Stateless localhost/serverless proxy. It never reads the user's local data —
// the workspace context is assembled in the browser and passed in as `system`.
// The API key is the user's own (BYO), from the request body or an env var.
// Supports Anthropic directly, or any OpenAI-compatible provider (OpenRouter).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Vercel: allow long model responses (Hobby tier caps at 60s).
export const maxDuration = 60;

type Provider = "anthropic" | "openrouter";

interface ChatRequest {
  provider?: Provider;
  apiKey?: string;
  model?: string;
  system?: string;
  messages?: { role: "user" | "assistant"; content: string }[];
}

type SendFrame = (frame: Record<string, unknown>) => void;

const MODELS_WITH_ADAPTIVE_THINKING = new Set([
  "claude-opus-4-8",
  "claude-sonnet-4-6",
]);

const MAX_TOKENS = 8192;

async function streamAnthropic(
  apiKey: string,
  model: string,
  system: string | undefined,
  messages: NonNullable<ChatRequest["messages"]>,
  send: SendFrame,
): Promise<void> {
  const client = new Anthropic({ apiKey });
  const messageStream = client.messages.stream({
    model,
    max_tokens: MAX_TOKENS,
    system,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
    ...(MODELS_WITH_ADAPTIVE_THINKING.has(model)
      ? { thinking: { type: "adaptive" as const } }
      : {}),
  });
  messageStream.on("text", (delta) => send({ type: "delta", text: delta }));
  await messageStream.finalMessage();
}

async function streamOpenRouter(
  apiKey: string,
  model: string,
  system: string | undefined,
  messages: NonNullable<ChatRequest["messages"]>,
  send: SendFrame,
): Promise<void> {
  const openaiMessages: { role: string; content: string }[] = [];
  if (system) openaiMessages.push({ role: "system", content: system });
  for (const m of messages) openaiMessages.push({ role: m.role, content: m.content });

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "X-Title": "Solo Studio",
    },
    body: JSON.stringify({
      model,
      stream: true,
      max_tokens: MAX_TOKENS,
      messages: openaiMessages,
    }),
  });

  if (!response.ok || !response.body) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `OpenRouter error ${response.status}: ${detail.slice(0, 300) || response.statusText}`,
    );
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const raw of lines) {
      const line = raw.trim();
      if (!line.startsWith("data:")) continue; // skip SSE comments / keep-alives
      const data = line.slice(5).trim();
      if (data === "[DONE]") return;
      let json: {
        error?: { message?: string };
        choices?: { delta?: { content?: string } }[];
      };
      try {
        json = JSON.parse(data);
      } catch {
        continue;
      }
      if (json.error) {
        throw new Error(json.error.message ?? "OpenRouter stream error");
      }
      const delta = json.choices?.[0]?.delta?.content;
      if (typeof delta === "string" && delta) send({ type: "delta", text: delta });
    }
  }
}

export async function POST(request: Request): Promise<Response> {
  let body: ChatRequest;
  try {
    body = (await request.json()) as ChatRequest;
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const provider: Provider =
    body.provider === "openrouter" ? "openrouter" : "anthropic";
  const apiKey =
    body.apiKey?.trim() ||
    (provider === "openrouter"
      ? process.env.OPENROUTER_API_KEY
      : process.env.ANTHROPIC_API_KEY);

  if (!apiKey) {
    return Response.json(
      { error: "No API key. Add one in the assistant settings." },
      { status: 400 },
    );
  }
  if (!body.messages || body.messages.length === 0) {
    return Response.json({ error: "No messages provided." }, { status: 400 });
  }

  const model =
    body.model ||
    (provider === "openrouter"
      ? "anthropic/claude-3.5-sonnet"
      : "claude-opus-4-8");
  const messages = body.messages;
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send: SendFrame = (frame) =>
        controller.enqueue(encoder.encode(JSON.stringify(frame) + "\n"));
      try {
        if (provider === "openrouter") {
          await streamOpenRouter(apiKey, model, body.system, messages, send);
        } else {
          await streamAnthropic(apiKey, model, body.system, messages, send);
        }
        send({ type: "done" });
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "The request to the model provider failed.";
        send({ type: "error", message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
