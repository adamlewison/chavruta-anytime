import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Next.js 16 Proxy (renamed from middleware).
 *
 * We perform an optimistic session check by looking for the auth session cookie.
 * The real authorization is enforced server-side in layouts / route handlers via
 * the `auth()` helper from NextAuth.  Calling `auth()` directly inside proxy
 * is unreliable in the NextAuth v5 beta, so a cookie-presence check keeps the
 * proxy fast and avoids edge-runtime compatibility issues.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes that never require authentication
  const publicPaths = ["/", "/sign-in", "/verify"];
  const isPublicPath =
    publicPaths.some((path) => pathname === path) ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon");

  if (isPublicPath) {
    return NextResponse.next();
  }

  // Optimistic session check — look for the NextAuth session cookie.
  // The cookie name follows NextAuth v5 conventions.
  const hasSession =
    request.cookies.has("authjs.session-token") ||
    request.cookies.has("__Secure-authjs.session-token");

  if (!hasSession) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
