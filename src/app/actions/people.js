"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { generateToken, requireUser } from "@/lib/auth";
import { deletePhoto } from "@/lib/photos";
import { requireDirector } from "@/lib/access";
import { INVITE_ROLES } from "@/lib/constants";
import { checkbox, optionalText, parseForm } from "@/lib/validation";

const refresh = (pageantId) => revalidatePath(`/manage/${pageantId}`, "layout");

// ---------- Invites (director) ----------

const inviteSchema = z.object({
  role: z.enum(Object.keys(INVITE_ROLES), { error: "Choose a role" }),
  label: optionalText(200),
  singleUse: checkbox,
});

export async function createInvite(pageantId, _prev, formData) {
  await requireDirector(pageantId);
  const { data, error } = parseForm(inviteSchema, formData);
  if (error) return { error };
  // Judge links are always single-use: a forwarded judge link would let anyone score.
  const singleUse = data.role === "JUDGE" ? true : data.singleUse;
  await db.invite.create({
    data: { pageantId, role: data.role, label: data.label, singleUse, token: generateToken(24) },
  });
  refresh(pageantId);
  return { ok: true };
}

export async function revokeInvite(pageantId, inviteId) {
  await requireDirector(pageantId);
  await db.invite.updateMany({
    where: { id: inviteId, pageantId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  refresh(pageantId);
  return { ok: true };
}

// ---------- Accepting an invite (any signed-in user) ----------

export async function acceptInvite(token, _prev, _formData) {
  const user = await requireUser(`/invite/${encodeURIComponent(token)}`);
  const invite = await db.invite.findUnique({ where: { token }, include: { pageant: true } });
  if (!invite || invite.revokedAt) return { error: "This invite link is no longer valid." };
  if (invite.singleUse && invite.uses > 0) return { error: "This invite link has already been used." };

  const { pageant } = invite;
  if (pageant.directorId === user.id) return { error: "You're the director of this pageant." };

  const [existingJudge, existingContestant] = await Promise.all([
    db.judge.findUnique({ where: { pageantId_userId: { pageantId: pageant.id, userId: user.id } } }),
    db.contestant.findUnique({ where: { pageantId_userId: { pageantId: pageant.id, userId: user.id } } }),
  ]);

  if (invite.role === "JUDGE") {
    if (existingJudge) redirect(`/judge/${pageant.id}`);
    if (existingContestant) return { error: "You're already a contestant in this pageant, so you can't judge it." };
    if (pageant.status === "COMPLETE") return { error: "This pageant has finished." };
  } else {
    if (existingContestant) redirect(`/compete/${pageant.id}`);
    if (existingJudge) return { error: "You're already a judge in this pageant, so you can't compete in it." };
    if (pageant.status !== "REGISTRATION") return { error: "Registration for this pageant isn't open." };
  }

  // Claim the invite atomically so a single-use link can't be redeemed twice concurrently.
  const claimed = await db.$transaction(async (tx) => {
    const { count } = await tx.invite.updateMany({
      where: { id: invite.id, revokedAt: null, ...(invite.singleUse && { uses: 0 }) },
      data: { uses: { increment: 1 } },
    });
    if (!count) return false;
    if (invite.role === "JUDGE") {
      await tx.judge.create({ data: { pageantId: pageant.id, userId: user.id } });
    } else {
      await tx.contestant.create({ data: { pageantId: pageant.id, userId: user.id, displayName: user.name } });
    }
    return true;
  });
  if (!claimed) return { error: "This invite link has already been used." };

  revalidatePath("/dashboard");
  refresh(pageant.id);
  redirect(invite.role === "JUDGE" ? `/judge/${pageant.id}` : `/compete/${pageant.id}/register`);
}

// ---------- Managing people (director) ----------

const contestantSchema = z.object({
  ageGroupId: z.string().optional().default(""),
  contestantNumber: z
    .string()
    .optional()
    .default("")
    .transform((v, ctx) => {
      if (!v.trim()) return null;
      const n = Number(v);
      if (!Number.isInteger(n) || n < 1 || n > 9999) {
        ctx.addIssue({ code: "custom", message: "Contestant number must be a whole number from 1 to 9999" });
        return z.NEVER;
      }
      return n;
    }),
});

export async function updateContestant(pageantId, contestantId, _prev, formData) {
  await requireDirector(pageantId);
  const { data, error } = parseForm(contestantSchema, formData);
  if (error) return { error };

  if (data.ageGroupId) {
    const group = await db.ageGroup.findFirst({ where: { id: data.ageGroupId, pageantId } });
    if (!group) return { error: "Choose a valid age group." };
  }
  if (data.contestantNumber !== null) {
    const clash = await db.contestant.findFirst({
      where: { pageantId, contestantNumber: data.contestantNumber, NOT: { id: contestantId } },
    });
    if (clash) return { error: `Number ${data.contestantNumber} is already assigned to ${clash.displayName}.` };
  }

  const { count } = await db.contestant.updateMany({
    where: { id: contestantId, pageantId },
    data: { ageGroupId: data.ageGroupId || null, contestantNumber: data.contestantNumber },
  });
  if (!count) return { error: "That contestant no longer exists." };
  refresh(pageantId);
  return { ok: true, message: "Saved." };
}

export async function removeContestant(pageantId, contestantId) {
  await requireDirector(pageantId);
  const contestant = await db.contestant.findFirst({ where: { id: contestantId, pageantId } });
  if (contestant) {
    await db.contestant.delete({ where: { id: contestant.id } });
    await deletePhoto(contestant.photoKey);
  }
  refresh(pageantId);
  redirect(`/manage/${pageantId}/people`);
}

export async function removeJudge(pageantId, judgeId) {
  await requireDirector(pageantId);
  await db.judge.deleteMany({ where: { id: judgeId, pageantId } });
  refresh(pageantId);
  return { ok: true };
}
