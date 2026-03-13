import { NextRequest, NextResponse } from "next/server";

function redirectToAuth(request: NextRequest) {
  const loginUrl = new URL("/auth", request.url);
  loginUrl.searchParams.set(
    "redirect",
    `${request.nextUrl.pathname}${request.nextUrl.search}`,
  );
  return NextResponse.redirect(loginUrl);
}

function decodeJWTRole(token: string): string | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padding = "=".repeat((4 - (base64.length % 4)) % 4);
    const decoded = JSON.parse(atob(base64 + padding));
    return decoded.role ?? null;
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("token")?.value;

  // Protect /admin — require admin role
  if (pathname.startsWith("/admin")) {
    if (!token) {
      return redirectToAuth(request);
    }
    const role = decodeJWTRole(token);
    if (role !== "admin") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // Protect authenticated routes
  if (
    pathname.startsWith("/profile") ||
    pathname.startsWith("/checkout") ||
    pathname.startsWith("/orders") ||
    pathname.startsWith("/order-confirm")
  ) {
    if (!token) {
      return redirectToAuth(request);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/profile/:path*",
    "/checkout/:path*",
    "/orders/:path*",
    "/order-confirm/:path*",
  ],
};
