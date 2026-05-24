import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";

const COOKIE_NAME = "masaze_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET nie je nastavený v prostredí.");
  }
  return new TextEncoder().encode(secret);
}

function sha256(value: string): Buffer {
  return createHash("sha256").update(value).digest();
}

// Constant-time comparison of the supplied password against ADMIN_PASSWORD.
export function verifyPassword(input: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  const a = sha256(input);
  const b = sha256(expected);
  return timingSafeEqual(a, b);
}

export async function createSession(): Promise<void> {
  const token = await new SignJWT({ admin: true })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(getSecret());

  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function isAuthenticated(): Promise<boolean> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload.admin === true;
  } catch {
    return false;
  }
}

// Guards a server component: redirects to the login page (before any data is
// fetched) when the request is not authenticated. Defense in depth alongside
// the proxy, so protected data never renders even if the proxy is bypassed.
export async function requireAdmin(): Promise<void> {
  if (!(await isAuthenticated())) {
    redirect("/admin/login");
  }
}
