import "server-only";

// ----------------------------------------------------------------------------
// Server-only config. Importing this from a Client Component is a build error
// (via "server-only"), so secret keys can never leak into the browser bundle.
//
// Base URLs are NOT secret and have sensible defaults; only the API keys must
// come from .env.local. Use `configured` to branch gracefully when a key is
// absent (the POC falls back to local proofs so the demo never hard-fails).
// ----------------------------------------------------------------------------

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable ${name}. Add it to .env.local (see .env.example).`,
    );
  }
  return value;
}

export const config = {
  // Proof Fabric Protocol — proof of transaction + verification
  proof: {
    baseUrl: process.env.PROOF_API_BASE_URL || "https://fea-crypto.emergent.host",
    get apiKey() {
      return requireEnv("PROOF_API_KEY");
    },
    get configured() {
      return Boolean(process.env.PROOF_API_KEY);
    },
  },
  // TNG Identity — verifiable credentials issuer/verifier (env-specific paths)
  tngIdentity: {
    baseUrl: process.env.TNG_IDENTITY_BASE_URL || "",
    get apiKey() {
      return requireEnv("TNG_IDENTITY_API_KEY");
    },
    get configured() {
      return Boolean(process.env.TNG_IDENTITY_API_KEY && process.env.TNG_IDENTITY_BASE_URL);
    },
  },
};
