import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "family-tree-secure-jwt-secret-2024-utsav"
);

export interface AuthPayload {
  userId: string;
  email: string;
  role: string;
}

export async function signToken(payload: AuthPayload): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .setIssuedAt()
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<AuthPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as AuthPayload;
  } catch {
    return null;
  }
}

export async function getAuthUser(): Promise<AuthPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload) return null;

  // Always fetch fresh role from DB (handles direct DB role changes)
  try {
    const { default: prisma } = await import("@/app/lib/prisma");
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { role: true },
    });
    if (user) payload.role = user.role;
  } catch {
    // If DB lookup fails, fall back to token role
  }

  return payload;
}

export function createAuthCookie(token: string) {
  return {
    name: "auth-token",
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  };
}
