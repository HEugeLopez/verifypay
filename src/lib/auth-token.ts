// Shared auth-gate helper (used by the login route and the proxy).
// The cookie holds a SHA-256 token derived from APP_PASSWORD — never the
// password itself. The gate is only active when APP_PASSWORD is set.

export const AUTH_COOKIE = "vp_auth";

export async function tokenFor(password: string): Promise<string> {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(`verifypay:${password}`),
  );
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
