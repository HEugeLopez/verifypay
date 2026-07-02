import { tngIdentity } from "@/lib/server/tngIdentity";
import { config } from "@/lib/server/config";

// GET /api/identity/preflight
// Cheap check that the deployment's TNG credentials actually AUTHENTICATE
// (not just that the env vars are present), so the onboarding UI can warn up
// front instead of failing halfway through the flow. Probes the same verifier
// endpoint the "present" step uses: 200 = key good, 401 = key invalid/expired.
export async function GET() {
  if (!config.tngIdentity.hasCredentials) {
    return Response.json({ ok: true, tng: "unconfigured" });
  }
  const definitionId = config.tngIdentity.definitionIdOptional;
  if (!definitionId) {
    return Response.json({ ok: true, tng: "error", detail: "TNG_VERIFIER_DEFINITION_ID is not set" });
  }
  try {
    await tngIdentity.createPresentationRequest(definitionId);
    return Response.json({ ok: true, tng: "ok" });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const unauthorized = /\b401\b|unauthorized/i.test(msg);
    return Response.json({
      ok: true,
      tng: unauthorized ? "unauthorized" : "error",
      detail: msg.slice(0, 200),
    });
  }
}
