import { PrismaClient } from "@prisma/client";

// Reuse one client across hot reloads in development.
const globalForPrisma = globalThis;

export const db =
  globalForPrisma.__prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.__prisma = db;
