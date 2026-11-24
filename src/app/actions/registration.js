"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireContestant } from "@/lib/access";
import { ageOn, eligibilityDate, formatDate, parseDateInput } from "@/lib/age";

const MAX_ANSWER = { SHORT_TEXT: 300, LONG_TEXT: 5000 };

export async function saveRegistration(pageantId, _prev, formData) {
  const { contestant, pageant } = await requireContestant(pageantId);
  if (pageant.status !== "REGISTRATION") {
    return { error: "Registration is closed, so your entry can no longer be changed." };
  }

  const displayName = String(formData.get("displayName") ?? "").trim();
  if (!displayName) return { error: "Name is required." };
  if (displayName.length > 100) return { error: "Name must be at most 100 characters." };

  const dateOfBirth = parseDateInput(String(formData.get("dateOfBirth") ?? ""));
  if (!dateOfBirth || dateOfBirth > new Date()) return { error: "Enter a valid date of birth." };

  const ageGroup = await db.ageGroup.findFirst({
    where: { id: String(formData.get("ageGroupId") ?? ""), pageantId },
  });
  if (!ageGroup) return { error: "Choose your age group." };

  const asOf = eligibilityDate(pageant);
  const age = ageOn(dateOfBirth, asOf);
  if (age < ageGroup.minAge || age > ageGroup.maxAge) {
    return {
      error: `You'll be ${age} on ${formatDate(asOf)}, which is outside ${ageGroup.name} (ages ${ageGroup.minAge}–${ageGroup.maxAge}).`,
    };
  }

  if (pageant.requirePhoto && !contestant.photoKey) {
    return { error: "Please upload a photo so the judges can recognize you." };
  }

  const questions = await db.question.findMany({ where: { pageantId } });
  const answers = [];
  for (const q of questions) {
    const value = String(formData.get(`q_${q.id}`) ?? "").trim();
    if (q.required && !value) return { error: `Please answer: “${q.prompt}”` };
    const max = MAX_ANSWER[q.type] ?? 300;
    if (value.length > max) return { error: `Your answer to “${q.prompt}” must be at most ${max} characters.` };
    answers.push({ questionId: q.id, value });
  }

  await db.$transaction(async (tx) => {
    let contestantNumber = contestant.contestantNumber;
    if (contestantNumber === null) {
      const top = await tx.contestant.aggregate({ where: { pageantId }, _max: { contestantNumber: true } });
      contestantNumber = (top._max.contestantNumber ?? 0) + 1;
    }
    await tx.contestant.update({
      where: { id: contestant.id },
      data: {
        displayName,
        dateOfBirth,
        ageGroupId: ageGroup.id,
        contestantNumber,
        registeredAt: contestant.registeredAt ?? new Date(),
      },
    });
    for (const a of answers) {
      if (a.value) {
        await tx.answer.upsert({
          where: { contestantId_questionId: { contestantId: contestant.id, questionId: a.questionId } },
          create: { contestantId: contestant.id, questionId: a.questionId, value: a.value },
          update: { value: a.value },
        });
      } else {
        await tx.answer.deleteMany({ where: { contestantId: contestant.id, questionId: a.questionId } });
      }
    }
  });

  revalidatePath(`/compete/${pageantId}`, "layout");
  revalidatePath(`/manage/${pageantId}`, "layout");
  redirect(`/compete/${pageantId}?saved=1`);
}
