import { tngIssuer } from "@/lib/server/tngIssuer";
import { config } from "@/lib/server/config";
import { getDemoCredential, DEMO_CREDENTIALS } from "@/lib/demo-credentials";

// POST /api/identity/issue-credential
// Body: { credentialId }  (defaults to the bank account credential)
// Issues the chosen demo verifiable credential and returns the claim URI (QR).
export async function POST(request: Request) {
  if (!config.tngIdentity.hasCredentials) {
    return Response.json({ ok: false, error: "TNG Identity not configured" }, { status: 200 });
  }
  let credentialId = "bankAccountCredential";
  try {
    const body = await request.json();
    if (body?.credentialId) credentialId = body.credentialId;
  } catch {
    /* default */
  }
  const def = getDemoCredential(credentialId);
  if (!def) {
    return Response.json(
      { ok: false, error: `Unknown credential. Try one of: ${DEMO_CREDENTIALS.map((c) => c.credentialId).join(", ")}` },
      { status: 400 },
    );
  }
  try {
    const offer = await tngIssuer.issueCredential(def.credentialId, def.claims);
    return Response.json({ ok: true, offer, claims: def.claims, credentialName: def.name });
  } catch (e) {
    return Response.json(
      { ok: false, error: e instanceof Error ? e.message : String(e) },
      { status: 502 },
    );
  }
}
