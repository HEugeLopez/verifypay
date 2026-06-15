import { proofFabric } from "@/lib/server/proofFabric";
import { config } from "@/lib/server/config";

// POST /api/proof/generate
// Body: { transactionId, amount (major units), currency, payerId, payeeId, timestamp, idempotencyKey? }
// Returns the Proof Fabric artifact, or { ok: false } so the client can fall
// back to a local proof when the key isn't configured / the service is down.
export async function POST(request: Request) {
  if (!config.proof.configured) {
    return Response.json({ ok: false, error: "PROOF_API_KEY not configured" }, { status: 200 });
  }
  try {
    const b = await request.json();
    const artifact = await proofFabric.generate({
      idempotencyKey: b.idempotencyKey ?? b.transactionId,
      transactionId: b.transactionId,
      timestamp: b.timestamp ?? new Date().toISOString(),
      amount: Math.round(Number(b.amount) * 100), // major → minor units
      currency: b.currency,
      payerId: b.payerId,
      payeeId: b.payeeId,
    });
    return Response.json({ ok: true, artifact });
  } catch (e) {
    return Response.json(
      { ok: false, error: e instanceof Error ? e.message : String(e) },
      { status: 502 },
    );
  }
}
