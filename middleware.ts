import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback-secret-change-me"
);

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("auth-token")?.value;
  const { pathname } = request.nextUrl;

  const isAuthPage = pathname === "/login" || pathname === "/register";
  const isPendingPage = pathname === "/pending";

  if (isAuthPage) {
    if (token) {
      try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        const status = (payload as { status?: string }).status;
        if (status === "PENDING") {
          return NextResponse.redirect(new URL("/pending", request.url));
        }
        return NextResponse.redirect(new URL("/dashboard", request.url));
      } catch {
        // Invalid token, let them access auth pages
      }
    }
    return NextResponse.next();
  }

  // Pending page — allow access only if authenticated and pending
  if (isPendingPage) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    try {
      await jwtVerify(token, JWT_SECRET);
      return NextResponse.next();
    } catch {
      const response = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.delete("auth-token");
      return response;
    }
  }

  // Protected dashboard routes
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const status = (payload as { status?: string }).status;

    // Block pending users from dashboard — redirect to waiting page
    if (status === "PENDING") {
      return NextResponse.redirect(new URL("/pending", request.url));
    }

    return NextResponse.next();
  } catch {
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete("auth-token");
    return response;
  }
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/register", "/pending"],
};
