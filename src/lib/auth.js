import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { db } from "./db";
import { SESSION_COOKIE, SESSION_TTL_DAYS } from "./constants";

const BCRYPT_COST = 12;

export function hashPassword(password) {
  return bcrypt.hash(password, BCRYPT_COST);
}

export function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

// Used to keep login timing similar whether or not the email exists.
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", BCRYPT_COST);
export function burnPasswordCheck(password) {
  return bcrypt.compare(password, DUMMY_HASH);
}

function hashToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

export function generateToken(bytes = 32) {
  return randomBytes(bytes).toString("base64url");
}

export async function createSession(userId) {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);
  await db.session.create({
    data: { tokenHash: hashToken(token), userId, expiresAt },
  });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    await db.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  }
  jar.delete(SESSION_COOKIE);
}

// Returns the signed-in user ({ id, email, name }) or null. Memoized per request.
export const getCurrentUser = cache(async () => {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await db.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: { select: { id: true, email: true, name: true } } },
  });
  if (!session) return null;
  if (session.expiresAt < new Date()) {
    await db.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }
  return session.user;
});

export async function requireUser(returnTo) {
  const user = await getCurrentUser();
  if (!user) {
    const next = returnTo ? `?next=${encodeURIComponent(returnTo)}` : "";
    redirect(`/login${next}`);
  }
  return user;
}

// Only allow same-site relative redirects after login (prevents open redirects).
export function safeNextPath(next) {
  if (typeof next !== "string") return "/dashboard";
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return "/dashboard";
  return next;
}
