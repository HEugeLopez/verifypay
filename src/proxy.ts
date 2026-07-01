import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE, tokenFor } from "@/lib/auth-token";

// Password gate. Active only when APP_PASSWORD is set (so local dev is open).
// Protects every page + /api/* route; /login and the login API stay public.
const PUBLIC_PATHS = ["/login", "/api/auth/login"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Per-deployment landing page: a Vercel project with DEMO_HOME=onboard sends
  // its root to the onboarding demo, while the default project keeps the loan
  // demo at "/". One codebase, two demos.
  if (
    process.env.DEMO_HOME === "onboard" &&
    pathname === "/" &&
    request.nextUrl.searchParams.get("d") !== "loan" // escape used by the demo switcher
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/onboard";
    return NextResponse.redirect(url);
  }

  const password = process.env.APP_PASSWORD;
  if (!password) return NextResponse.next(); // gate disabled

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
