import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/auth";
import {
  checkRateLimit,
  createRateLimitResponse,
  getClientIp,
} from "@/lib/security/rate-limiter";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Bypass CORS preflight requests
  if (request.method === "OPTIONS") {
    return NextResponse.next();
  }

  // 1. API Rate Limiting for all /api routes
  if (pathname.startsWith("/api")) {
    const ip = getClientIp(request);
    const isMutation = ["POST", "PUT", "PATCH", "DELETE"].includes(
      request.method,
    );

    // 30 requests/min for write/mutation endpoints, 100 requests/min for read endpoints
    const limit = isMutation ? 30 : 100;
    const windowSeconds = 60;
    const bucket = pathname.split("/").slice(0, 3).join("/");
    const key = `ratelimit:${ip}:${bucket}:${isMutation ? "write" : "read"}`;

    const rateResult = checkRateLimit(key, limit, windowSeconds);
    if (!rateResult.success) {
      return createRateLimitResponse(rateResult, request.headers.get("origin"));
    }
  }

  // 2. Auth checks
  const needsAuth =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api/employees") ||
    pathname.startsWith("/api/articles") ||
    pathname.startsWith("/api/tech-stacks");

  let session = null;
  if (needsAuth) {
    session = await auth();
  }

  const isLoggedIn = Boolean(session?.user?.id);
  const role = session?.user?.role;

  if (pathname.startsWith("/admin/login")) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin")) {
    if (!isLoggedIn) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (pathname.startsWith("/admin/employees") && role !== "SUPERUSER") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }

    if (pathname.startsWith("/admin/articles") && role !== "SUPERUSER") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
  }

  if (
    pathname.startsWith("/api/employees") ||
    pathname.startsWith("/api/articles") ||
    pathname.startsWith("/api/tech-stacks")
  ) {
    if (!isLoggedIn) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }
    if (role !== "SUPERUSER") {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*", "/api/:path*"],
};
