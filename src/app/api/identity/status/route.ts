import { tngIdentity } from "@/lib/server/tngIdentity";
import { config } from "@/lib/server/config";

// GET /api/identity/status?correlationId=...
// Returns the current status and, once "valid", the verified credentials/claims.
export async function GET(request: Request) {
  if (!config.tngIdentity.configured) {
    return Response.json({ ok: false, error: "TNG Identity not configured" }, { status: 200 });
  }
  const { searchParams } = new URL(request.url);
  const correlationId = searchParams.get("correlationId");
  if (!correlationId) {
    return Response.json({ ok: false, error: "Missing correlationId" }, { status: 400 });
  }
  try {
    const status = await tngIdentity.getStatus(correlationId);
    return Response.json({ ok: true, ...status });
  } catch (e) {
    return Response.json(
      { ok: false, error: e instanceof Error ? e.message : String(e) },
      { status: 502 },
    );
  }
}
