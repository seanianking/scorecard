"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { requireDirector } from "@/lib/access";
import { parseDateInput } from "@/lib/age";
import { deletePhoto } from "@/lib/photos";
import { PAGEANT_STATUSES } from "@/lib/constants";
import { DEFAULT_QUICK_COMMENTS } from "@/lib/quick-comments";
import { checkbox, optionalText, parseForm, text } from "@/lib/validation";

const pageantSchema = z.object({
  name: text("Pageant name", 120),
  description: optionalText(2000),
  location: optionalText(200),
  requirePhoto: checkbox,
  eventDate: z
    .string()
    .optional()
    .default("")
    .transform((v, ctx) => {
      if (!v) return null;
      const d = parseDateInput(v);
      if (!d) {
        ctx.addIssue({ code: "custom", message: "Enter a valid event date" });
        return z.NEVER;
      }
      return d;
    }),
});

export async function createPageant(_prev, formData) {
  const user = await requireUser();
  const { data, error } = parseForm(pageantSchema, formData);
  if (error) return { error };

  const pageant = await db.pageant.create({
    data: {
      ...data,
      directorId: user.id,
      quickComments: { create: DEFAULT_QUICK_COMMENTS.map((text, sortOrder) => ({ text, sortOrder })) },
    },
  });
  redirect(`/manage/${pageant.id}`);
}

export async function updatePageant(pageantId, _prev, formData) {
  await requireDirector(pageantId);
  const { data, error } = parseForm(pageantSchema, formData);
  if (error) return { error };

  await db.pageant.update({ where: { id: pageantId }, data });
  revalidatePath(`/manage/${pageantId}`, "layout");
  return { ok: true, message: "Details saved." };
}

export async function setStatus(pageantId, _prev, formData) {
  const { pageant } = await requireDirector(pageantId);
  const status = formData.get("status");
  if (!PAGEANT_STATUSES.includes(status)) return { error: "Unknown status." };

  const forward = PAGEANT_STATUSES.indexOf(status) > PAGEANT_STATUSES.indexOf(pageant.status);
  if (forward && status !== "SETUP") {
    const ageGroups = await db.ageGroup.count({ where: { pageantId } });
    if (ageGroups === 0) return { error: "Add at least one age group before opening registration." };
  }
  if (forward && (status === "JUDGING" || status === "COMPLETE")) {
    const criteria = await db.criterion.count({ where: { event: { pageantId } } });
    if (criteria === 0) return { error: "Add at least one event with judging criteria before judging." };
  }

  await db.pageant.update({
    where: { id: pageantId },
    // Moving out of COMPLETE automatically unpublishes results.
    data: { status, ...(status !== "COMPLETE" && { resultsPublished: false }) },
  });
  revalidatePath(`/manage/${pageantId}`, "layout");
  return { ok: true };
}

export async function setResultsPublished(pageantId, _prev, formData) {
  const { pageant } = await requireDirector(pageantId);
  const publish = formData.get("publish") === "true";
  if (publish && pageant.status !== "COMPLETE") {
    return { error: "Mark the pageant complete before publishing results." };
  }
  await db.pageant.update({ where: { id: pageantId }, data: { resultsPublished: publish } });
  revalidatePath(`/manage/${pageantId}`, "layout");
  return { ok: true };
}

export async function deletePageant(pageantId) {
  await requireDirector(pageantId);
  const photos = await db.contestant.findMany({
    where: { pageantId, photoKey: { not: null } },
    select: { photoKey: true },
  });
  await db.pageant.delete({ where: { id: pageantId } });
  await Promise.all(photos.map((p) => deletePhoto(p.photoKey)));
  redirect("/dashboard");
}
