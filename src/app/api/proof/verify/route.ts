import { proofFabric } from "@/lib/server/proofFabric";
import { config } from "@/lib/server/config";

// POST /api/proof/verify
// Body: { feaId? } or { feaPayload, signature, signatureVersion? }
// Prefers authoritative public verify-by-id; falls back to payload+signature.
export async function POST(request: Request) {
  if (!config.proof.configured) {
    return Response.json({ ok: false, error: "PROOF_API_KEY not configured" }, { status: 200 });
  }
  try {
    const { feaId, feaPayload, signature, signatureVersion } = await request.json();
    if (feaId) {
      const pub = await proofFabric.publicVerify(feaId);
      return Response.json({
        ok: true,
        result: { valid: pub.signature_valid, signature_version: pub.signature_version },
      });
    }
    const result = await proofFabric.verify(feaPayload, signature, signatureVersion);
    return Response.json({ ok: true, result });
  } catch (e) {
    return Response.json(
      { ok: false, error: e instanceof Error ? e.message : String(e) },
      { status: 502 },
    );
  }
}
