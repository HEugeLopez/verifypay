import { tngIdentity } from "@/lib/server/tngIdentity";
import { config } from "@/lib/server/config";

// POST /api/identity/request
// Creates a TNG verifiable-presentation request and returns the QR/deeplink URI.
export async function POST() {
  if (!config.tngIdentity.configured) {
    return Response.json(
      {
        ok: false,
        error:
          "TNG Identity not configured. Set TNG_IDENTITY_ENV_HASH, TNG_IDENTITY_API_KEY and TNG_VERIFIER_DEFINITION_ID in .env.local.",
      },
      { status: 200 },
    );
  }
  try {
    const created = await tngIdentity.createPresentationRequest();
    return Response.json({
      ok: true,
      correlationId: created.correlationId,
      definitionId: created.definitionId,
      authRequestURI: created.authRequestURI,
    });
  } catch (e) {
    return Response.json(
      { ok: false, error: e instanceof Error ? e.message : String(e) },
      { status: 502 },
    );
  }
}
