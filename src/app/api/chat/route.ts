import Anthropic from "@anthropic-ai/sdk";

// Stateless localhost proxy to Anthropic's Messages API. It never reads the
// user's local data — the workspace context is assembled in the browser and
// passed in as `system`. The API key is the user's own (BYO), taken from the
// request body or the ANTHROPIC_API_KEY env var.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Vercel: allow long Claude responses (Hobby tier caps at 60s).
export const maxDuration = 60;

interface ChatRequest {
  apiKey?: string;
  model?: string;
  system?: string;
  messages?: { role: "user" | "assistant"; content: string }[];
}

const MODELS_WITH_ADAPTIVE_THINKING = new Set([
  "claude-opus-4-8",
  "claude-sonnet-4-6",
]);

export async function POST(request: Request): Promise<Response> {
  let body: ChatRequest;
  try {
    body = (await request.json()) as ChatRequest;
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const apiKey = body.apiKey?.trim() || process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "No Anthropic API key. Add one in the assistant settings." },
      { status: 400 },
    );
  }
  if (!body.messages || body.messages.length === 0) {
    return Response.json({ error: "No messages provided." }, { status: 400 });
  }

  const model = body.model || "claude-opus-4-8";
  const client = new Anthropic({ apiKey });
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (frame: Record<string, unknown>) =>
        controller.enqueue(encoder.encode(JSON.stringify(frame) + "\n"));

      try {
        const messageStream = client.messages.stream({
          model,
          max_tokens: 8192,
          system: body.system,
          messages: body.messages!.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          ...(MODELS_WITH_ADAPTIVE_THINKING.has(model)
            ? { thinking: { type: "adaptive" as const } }
            : {}),
        });

        messageStream.on("text", (delta) => send({ type: "delta", text: delta }));
        await messageStream.finalMessage();
        send({ type: "done" });
      } catch (error) {
        const message =
          error instanceof Anthropic.APIError
            ? error.message
            : "The request to Anthropic failed.";
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
