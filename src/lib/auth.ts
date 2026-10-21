import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { NextRequest } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET || "warga-jwt-secret-key-32-chars-long-secure-random";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "warga-jwt-refresh-secret-key-32-chars-long";

export interface JWTPayload {
  userId: string;
  fullName: string;
  phoneNumber: string;
  status: string;
  rwId: string;
  rtId: string;
  roles: string[];
  permissions: string[];
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateAccessToken(payload: JWTPayload): string {
  // Access Token 15 menit
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "15m" });
}

export function generateRefreshToken(userId: string): string {
  // Refresh Token 7 hari
  return jwt.sign({ userId }, JWT_REFRESH_SECRET, { expiresIn: "7d" });
}

export function verifyAccessToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (err) {
    return null;
  }
}

export function verifyRefreshToken(token: string): { userId: string } | null {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET) as { userId: string };
  } catch (err) {
    return null;
  }
}

/**
 * Extract authenticated user from Next.js request
 * Looks in Authorization header (Bearer ...) or 'warga_token' cookie
 */
export function getAuthUser(req: NextRequest): JWTPayload | null {
  const authHeader = req.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    return verifyAccessToken(token);
  }

  const cookieToken = req.cookies.get("warga_access_token")?.value;
  if (cookieToken) {
    return verifyAccessToken(cookieToken);
  }

  return null;
}

/**
 * RBAC Guard Check
 */
export function hasPermission(user: JWTPayload | null, requiredPermission: string): boolean {
  if (!user) return false;
  if (user.roles.includes("SUPER_ADMIN")) return true;
  return user.permissions.includes(requiredPermission);
}

export function hasRole(user: JWTPayload | null, allowedRoles: string[]): boolean {
  if (!user) return false;
  if (user.roles.includes("SUPER_ADMIN")) return true;
  return user.roles.some((r) => allowedRoles.includes(r));
}

