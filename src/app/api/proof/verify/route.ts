import { proofFabric } from "@/lib/server/proofFabric";
import { config } from "@/lib/server/config";

// POST /api/proof/verify
// Body: { feaPayload, signature }
// Re-verifies a Proof Fabric artifact's payload + signature server-side.
export async function POST(request: Request) {
  if (!config.proof.configured) {
    return Response.json({ ok: false, error: "PROOF_API_KEY not configured" }, { status: 200 });
  }
  try {
    const { feaPayload, signature } = await request.json();
    const result = await proofFabric.verify(feaPayload, signature);
    return Response.json({ ok: true, result });
  } catch (e) {
    return Response.json(
      { ok: false, error: e instanceof Error ? e.message : String(e) },
      { status: 502 },
    );
  }
}
