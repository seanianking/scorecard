import { z } from "zod";

// Parse FormData with a zod schema. Returns { data } or { error } (first message, user-facing).
export function parseForm(schema, formData) {
  const raw = {};
  for (const [key, value] of formData.entries()) {
    if (key.startsWith("$ACTION")) continue; // Next.js internal fields
    raw[key] = typeof value === "string" ? value : value;
  }
  const result = schema.safeParse(raw);
  if (!result.success) {
    return { error: result.error.issues[0]?.message ?? "Invalid input" };
  }
  return { data: result.data };
}

export const text = (label, max = 200) =>
  z
    .string({ error: `${label} is required` })
    .trim()
    .min(1, `${label} is required`)
    .max(max, `${label} must be at most ${max} characters`);

export const optionalText = (max = 2000) =>
  z.string().trim().max(max, `Must be at most ${max} characters`).optional().default("");

export const checkbox = z
  .union([z.literal("on"), z.literal("true"), z.literal("")])
  .optional()
  .transform((v) => v === "on" || v === "true");

export const intField = (label, min, max) =>
  z.coerce
    .number({ error: `${label} must be a number` })
    .int(`${label} must be a whole number`)
    .min(min, `${label} must be at least ${min}`)
    .max(max, `${label} must be at most ${max}`);

export const numberField = (label, min, max) =>
  z.coerce
    .number({ error: `${label} must be a number` })
    .refine(Number.isFinite, `${label} must be a number`)
    .min(min, `${label} must be at least ${min}`)
    .max(max, `${label} must be at most ${max}`);

export const email = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email("Enter a valid email address"))
  .refine((v) => v.length <= 254, "Email is too long");

export const password = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password must be at most 128 characters");
