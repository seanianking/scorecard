import "server-only";
import { notFound } from "next/navigation";
import { db } from "./db";
import { requireUser } from "./auth";

// Every helper here returns 404 rather than 403 so we don't reveal which pageants exist.

export async function requireDirector(pageantId) {
  const user = await requireUser();
  const pageant = await db.pageant.findUnique({ where: { id: pageantId } });
  if (!pageant || pageant.directorId !== user.id) notFound();
  return { user, pageant };
}

export async function requireJudge(pageantId) {
  const user = await requireUser();
  const judge = await db.judge.findUnique({
    where: { pageantId_userId: { pageantId, userId: user.id } },
    include: { pageant: true },
  });
  if (!judge) notFound();
  return { user, judge, pageant: judge.pageant };
}

export async function requireContestant(pageantId) {
  const user = await requireUser();
  const contestant = await db.contestant.findUnique({
    where: { pageantId_userId: { pageantId, userId: user.id } },
    include: { pageant: true },
  });
  if (!contestant) notFound();
  return { user, contestant, pageant: contestant.pageant };
}
