import { AUTH_COOKIE, tokenFor } from "@/lib/auth-token";

// POST /api/auth/login  Body: { password }
// Validates against APP_PASSWORD and sets the gate cookie on success.
export async function POST(request: Request) {
  const expected = process.env.APP_PASSWORD;
  if (!expected) {
    // Gate disabled (no password configured) — nothing to do.
    return Response.json({ ok: true, disabled: true });
  }
  let password = "";
  try {
    ({ password } = await request.json());
  } catch {
    /* ignore */
  }
  if (!password || password !== expected) {
    return Response.json({ ok: false, error: "Incorrect password" }, { status: 401 });
  }
  const token = await tokenFor(expected);
  const res = Response.json({ ok: true });
  res.headers.append(
    "Set-Cookie",
    `${AUTH_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=604800`,
  );
  return res;
}
