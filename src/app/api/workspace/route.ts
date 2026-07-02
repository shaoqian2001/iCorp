import { auth } from "@/auth";
import { getWorkspace, saveWorkspace } from "@/lib/cloud/db";

// Protected per-user workspace backup. GET restores the stored snapshot; PUT
// saves one. Never touches the local (IndexedDB) store — it only persists the
// JSON blob the client sends, keyed by the signed-in user.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isSnapshot(value: unknown): boolean {
  return (
    typeof value === "object" &&
    value !== null &&
    "version" in value &&
    "data" in value
  );
}

export async function GET(): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Not signed in." }, { status: 401 });
  }
  try {
    const stored = await getWorkspace(session.user.id);
    return Response.json({
      data: stored?.data ?? null,
      updatedAt: stored?.updatedAt ?? null,
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Restore failed." },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Not signed in." }, { status: 401 });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }
  if (!isSnapshot(body)) {
    return Response.json(
      { error: "Payload is not a workspace snapshot." },
      { status: 400 },
    );
  }
  try {
    const { updatedAt } = await saveWorkspace(session.user.id, body);
    return Response.json({ updatedAt });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Backup failed." },
      { status: 500 },
    );
  }
}
