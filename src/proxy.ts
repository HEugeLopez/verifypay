import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE, tokenFor } from "@/lib/auth-token";

// Password gate. Active only when APP_PASSWORD is set (so local dev is open).
// Protects every page + /api/* route; /login and the login API stay public.
const PUBLIC_PATHS = ["/login", "/api/auth/login"];

export async function proxy(request: NextRequest) {
  const password = process.env.APP_PASSWORD;
  if (!password) return NextResponse.next(); // gate disabled

  const { pathname } = request.nextUrl;
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return NextResponse.next();
  }

  const cookie = request.cookies.get(AUTH_COOKIE)?.value;
  const expected = await tokenFor(password);
  if (cookie && cookie === expected) return NextResponse.next();

  // Unauthenticated
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("from", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  // Run on everything except Next internals and static assets.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
