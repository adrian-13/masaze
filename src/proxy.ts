import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "masaze_session";

async function hasValidSession(token: string | undefined): Promise<boolean> {
  if (!token || !process.env.AUTH_SECRET) return false;
  try {
    const secret = new TextEncoder().encode(process.env.AUTH_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return payload.admin === true;
  } catch {
    return false;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(COOKIE_NAME)?.value;
  const authed = await hasValidSession(token);

  const isLogin = pathname === "/admin/login";

  // Block any admin route (except the login page) for unauthenticated users
  // before the page renders, so protected data never reaches the response.
  if (!isLogin && !authed) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    return NextResponse.redirect(url);
  }

  // Already authenticated users skip the login screen.
  if (isLogin && authed) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
