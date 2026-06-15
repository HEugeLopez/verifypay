import "server-only";

// ----------------------------------------------------------------------------
// Server-only config. Importing this from a Client Component is a build error
// (via "server-only"), so secret keys can never leak into the browser bundle.
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
  tngIdentity: {
    get baseUrl() {
      return requireEnv("TNG_IDENTITY_BASE_URL");
    },
    get apiKey() {
      return requireEnv("TNG_IDENTITY_API_KEY");
    },
  },
  proof: {
    get baseUrl() {
      return requireEnv("PROOF_API_BASE_URL");
    },
    get apiKey() {
      return requireEnv("PROOF_API_KEY");
    },
  },
};
