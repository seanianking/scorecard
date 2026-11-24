"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  burnPasswordCheck,
  createSession,
  destroySession,
  hashPassword,
  safeNextPath,
  verifyPassword,
} from "@/lib/auth";
import { email, parseForm, password, text } from "@/lib/validation";

const registerSchema = z.object({
  name: text("Name", 100),
  email,
  password,
  next: z.string().optional(),
});

export async function register(_prev, formData) {
  const { data, error } = parseForm(registerSchema, formData);
  if (error) return { error };

  const existing = await db.user.findUnique({ where: { email: data.email } });
  if (existing) return { error: "An account with that email already exists. Try signing in." };

  const user = await db.user.create({
    data: { name: data.name, email: data.email, passwordHash: await hashPassword(data.password) },
  });
  await createSession(user.id);
  redirect(safeNextPath(data.next));
}

const loginSchema = z.object({
  email,
  password: z.string().min(1, "Password is required").max(128),
  next: z.string().optional(),
});

export async function login(_prev, formData) {
  const { data, error } = parseForm(loginSchema, formData);
  if (error) return { error };

  const user = await db.user.findUnique({ where: { email: data.email } });
  const valid = user
    ? await verifyPassword(data.password, user.passwordHash)
    : await burnPasswordCheck(data.password);
  if (!user || !valid) return { error: "Incorrect email or password." };

  await createSession(user.id);
  redirect(safeNextPath(data.next));
}

export async function logout() {
  await destroySession();
  redirect("/");
}
