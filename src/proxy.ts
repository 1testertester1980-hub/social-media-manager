import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const ADMIN_ONLY_PREFIXES = [
  "/dashboard",
  "/content",
  "/calendar/new",
  "/analytics",
  "/profiles",
  "/settings",
];

const PUBLIC_PATHS = ["/login"];

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const role = req.auth?.user?.role;
  const pathname = nextUrl.pathname;

  if (PUBLIC_PATHS.includes(pathname)) {
    if (isLoggedIn) {
      const dest = role === "ADMIN" ? "/dashboard" : "/my-tasks";
      return NextResponse.redirect(new URL(dest, nextUrl));
    }
    return NextResponse.next();
  }

  if (!isLoggedIn) {
    const loginUrl = new URL("/login", nextUrl);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (
    role === "WORKER" &&
    ADMIN_ONLY_PREFIXES.some((p) => pathname.startsWith(p))
  ) {
    return NextResponse.redirect(new URL("/my-tasks", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|uploads).*)",
  ],
};
