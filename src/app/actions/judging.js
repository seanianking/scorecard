"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireJudge } from "@/lib/access";
import { FEEDBACK_MAX_LENGTH as MAX_FEEDBACK } from "@/lib/quick-comments";

const ID_PATTERN = /^[a-z0-9]{10,40}$/i;

export async function saveScores(pageantId, contestantId, eventId, _prev, formData) {
  const { judge, pageant } = await requireJudge(pageantId);
  if (pageant.status !== "JUDGING") return { error: "Scoring is closed for this pageant." };

  const [contestant, event] = await Promise.all([
    db.contestant.findFirst({ where: { id: contestantId, pageantId, registeredAt: { not: null } } }),
    db.event.findFirst({ where: { id: eventId, pageantId }, include: { criteria: true } }),
  ]);
  if (!contestant || !event) return { error: "That contestant or event no longer exists." };

  const toSave = [];
  const toClear = [];
  for (const c of event.criteria) {
    const raw = String(formData.get(`c_${c.id}`) ?? "").trim();
    if (raw === "") {
      toClear.push(c.id);
      continue;
    }
    const value = Number(raw);
    if (!Number.isFinite(value) || value < 0 || value > c.maxScore) {
      return { error: `${c.name}: score must be between 0 and ${c.maxScore}.` };
    }
    if (Math.abs(Math.round(value * 100) - value * 100) > 1e-6) {
      return { error: `${c.name}: use at most two decimal places.` };
    }
    toSave.push({ criterionId: c.id, value: Math.round(value * 100) / 100 });
  }

  const comment = String(formData.get("feedback") ?? "").trim();
  if (comment.length > MAX_FEEDBACK) return { error: `Feedback must be at most ${MAX_FEEDBACK} characters.` };

  const base = { judgeId: judge.id, contestantId };
  await db.$transaction([
    ...toSave.map(({ criterionId, value }) =>
      db.score.upsert({
        where: { judgeId_contestantId_criterionId: { ...base, criterionId } },
        create: { ...base, criterionId, value },
        update: { value },
      }),
    ),
    db.score.deleteMany({ where: { ...base, criterionId: { in: toClear } } }),
    comment
      ? db.feedback.upsert({
          where: { judgeId_contestantId_eventId: { ...base, eventId } },
          create: { ...base, eventId, comment },
          update: { comment },
        })
      : db.feedback.deleteMany({ where: { ...base, eventId } }),
  ]);

  revalidatePath(`/judge/${pageantId}`, "layout");
  revalidatePath(`/manage/${pageantId}`, "layout");

  const nextId = String(formData.get("nextContestantId") ?? "");
  if (formData.get("intent") === "next" && ID_PATTERN.test(nextId)) {
    redirect(`/judge/${pageantId}/score/${nextId}?event=${encodeURIComponent(eventId)}`);
  }
  if (formData.get("intent") === "back") {
    redirect(`/judge/${pageantId}?event=${encodeURIComponent(eventId)}`);
  }
  return { ok: true, message: "Scores saved." };
}
