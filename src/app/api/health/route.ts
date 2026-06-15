import { config } from "@/lib/server/config";

// GET /api/health
// Reports which live integrations are configured (no secrets are returned) and
// names any missing env vars. Handy for confirming .env.local before demoing.
export async function GET() {
  const tngMissing = [
    !process.env.TNG_IDENTITY_ENV_HASH && "TNG_IDENTITY_ENV_HASH",
    !process.env.TNG_IDENTITY_API_KEY && "TNG_IDENTITY_API_KEY",
    !process.env.TNG_VERIFIER_DEFINITION_ID && "TNG_VERIFIER_DEFINITION_ID",
  ].filter(Boolean);

  const proofMissing = [!process.env.PROOF_API_KEY && "PROOF_API_KEY"].filter(Boolean);

  return Response.json({
    ok: true,
    integrations: {
      tngIdentity: {
        configured: config.tngIdentity.configured,
        host: config.tngIdentity.host,
        verifierBaseUrl: config.tngIdentity.configured ? config.tngIdentity.verifierBaseUrl : null,
        definitionId: process.env.TNG_VERIFIER_DEFINITION_ID ?? null,
        missing: tngMissing,
      },
      proof: {
        configured: config.proof.configured,
        baseUrl: config.proof.baseUrl,
        missing: proofMissing,
      },
    },
  });
}
