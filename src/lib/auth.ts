import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";
import { canUseApi } from "@/lib/permissions";

const JWT_SECRET = process.env.JWT_SECRET || "epicjourneys_jwt_secret_token_key_secured_2026";

export interface TokenPayload {
  userId: string;
  email: string;
  role: "admin" | "partner" | "user";
  name: string;
  assignedDestination?: string;
  /** Set only for staff (admins with a custom role). Super admins have no `perms` and can do everything. */
  perms?: string[];
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(payload: TokenPayload): string {
  // Staff tokens are short-lived and refreshed by the admin panel, so role changes take effect quickly.
  return jwt.sign(payload, JWT_SECRET, { expiresIn: payload.perms ? "2h" : "7d" });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

/**
 * Staff (an admin with a custom role) only keep admin rights on the APIs their role allows.
 * Everywhere else they are treated as an ordinary user, so every existing `role === "admin"` check
 * enforces their permissions without each route having to know about roles.
 */
function applyStaffScope(payload: TokenPayload | null, request: NextRequest): TokenPayload | null {
  if (!payload || payload.role !== "admin" || !Array.isArray(payload.perms)) return payload;
  const path = request.nextUrl?.pathname || "";
  if (path.startsWith("/api/auth/") || canUseApi(payload.perms, path)) return payload;
  return { ...payload, role: "user" };
}

export function isSuperAdmin(auth: TokenPayload | null): boolean {
  return Boolean(auth && auth.role === "admin" && !Array.isArray(auth.perms));
}

export function getAuthFromRequest(request: NextRequest): TokenPayload | null {
  const authHeader = request.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    return applyStaffScope(verifyToken(token), request);
  }

  // Also check cookies
  const cookieToken = request.cookies.get("token")?.value;
  if (cookieToken) {
    return applyStaffScope(verifyToken(cookieToken), request);
  }

  return null;
}
