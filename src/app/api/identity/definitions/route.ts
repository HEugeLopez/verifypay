import { config } from "@/lib/server/config";

// GET /api/identity/definitions
// Probes the likely "list templates" paths and returns the first TNG accepts,
// so we can discover valid definitionId values (and the correct path).
const CANDIDATE_PATHS = [
  "/api/v1/private/webapp/templates",
  "/api/private/webapp/templates",
  "/api/v1/private/webapp/presentation-definitions/templates",
  "/api/private/webapp/presentation-definitions/templates",
  "/api/v1/private/verifiable-presentations/definitions",
  "/api/private/verifiable-presentations/definitions",
  "/api/v1/private/templates",
];

export async function GET() {
  if (!config.tngIdentity.hasCredentials) {
    return Response.json(
      { ok: false, error: "Set TNG_IDENTITY_ENV_HASH and TNG_IDENTITY_API_KEY in .env.local" },
      { status: 200 },
    );
  }
  const base = config.tngIdentity.verifierBaseUrl;
  const attempts: { path: string; status?: number; error?: string }[] = [];

  for (const path of CANDIDATE_PATHS) {
    try {
      const res = await fetch(`${base}${path}`, {
        headers: { "x-api-key": config.tngIdentity.apiKey, "Content-Type": "application/json" },
        cache: "no-store",
      });
      const text = await res.text();
      if (res.ok) {
        let body: unknown;
        try {
          body = JSON.parse(text);
        } catch {
          body = text;
        }
        return Response.json({ ok: true, path, templates: body });
      }
      attempts.push({ path, status: res.status });
    } catch (e) {
      attempts.push({ path, error: e instanceof Error ? e.message : String(e) });
    }
  }
  return Response.json({ ok: false, error: "No templates endpoint matched", attempts }, { status: 200 });
}
