"use server";

// Director-only configuration: age groups, bio questions, events and judging criteria.
// Every child record is looked up scoped to the pageant so IDs from another pageant are rejected.

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireDirector } from "@/lib/access";
import { QUESTION_TYPES } from "@/lib/constants";
import { DEFAULT_QUICK_COMMENTS, QUICK_COMMENT_LIMIT, QUICK_COMMENT_MAX_LENGTH } from "@/lib/quick-comments";
import { checkbox, intField, numberField, optionalText, parseForm, text } from "@/lib/validation";

const refresh = (pageantId) => revalidatePath(`/manage/${pageantId}`, "layout");
const notFoundError = { error: "That item no longer exists. Refresh the page." };

async function nextSortOrder(model, where) {
  const last = await db[model].findFirst({ where, orderBy: { sortOrder: "desc" } });
  return (last?.sortOrder ?? -1) + 1;
}

// ---------- Age groups ----------

const ageGroupSchema = z
  .object({
    name: text("Group name", 80),
    minAge: intField("Minimum age", 0, 120),
    maxAge: intField("Maximum age", 0, 120),
  })
  .refine((v) => v.minAge <= v.maxAge, { message: "Minimum age can't be greater than maximum age" });

export async function addAgeGroup(pageantId, _prev, formData) {
  await requireDirector(pageantId);
  const { data, error } = parseForm(ageGroupSchema, formData);
  if (error) return { error };
  await db.ageGroup.create({
    data: { ...data, pageantId, sortOrder: await nextSortOrder("ageGroup", { pageantId }) },
  });
  refresh(pageantId);
  return { ok: true };
}

export async function updateAgeGroup(pageantId, id, _prev, formData) {
  await requireDirector(pageantId);
  const { data, error } = parseForm(ageGroupSchema, formData);
  if (error) return { error };
  const { count } = await db.ageGroup.updateMany({ where: { id, pageantId }, data });
  if (!count) return notFoundError;
  refresh(pageantId);
  return { ok: true, message: "Saved." };
}

export async function deleteAgeGroup(pageantId, id) {
  await requireDirector(pageantId);
  const inUse = await db.contestant.count({ where: { ageGroupId: id, pageantId } });
  if (inUse) {
    return { error: `${inUse} contestant(s) are registered in this group. Move or remove them first.` };
  }
  await db.ageGroup.deleteMany({ where: { id, pageantId } });
  refresh(pageantId);
  return { ok: true };
}

// ---------- Bio questions ----------

const questionSchema = z.object({
  prompt: text("Question", 500),
  type: z.enum(Object.keys(QUESTION_TYPES), { error: "Choose a question type" }),
  required: checkbox,
});

export async function addQuestion(pageantId, _prev, formData) {
  await requireDirector(pageantId);
  const { data, error } = parseForm(questionSchema, formData);
  if (error) return { error };
  await db.question.create({
    data: { ...data, pageantId, sortOrder: await nextSortOrder("question", { pageantId }) },
  });
  refresh(pageantId);
  return { ok: true };
}

export async function updateQuestion(pageantId, id, _prev, formData) {
  await requireDirector(pageantId);
  const { data, error } = parseForm(questionSchema, formData);
  if (error) return { error };
  const { count } = await db.question.updateMany({ where: { id, pageantId }, data });
  if (!count) return notFoundError;
  refresh(pageantId);
  return { ok: true, message: "Saved." };
}

export async function deleteQuestion(pageantId, id) {
  await requireDirector(pageantId);
  await db.question.deleteMany({ where: { id, pageantId } });
  refresh(pageantId);
  return { ok: true };
}

// ---------- Events ----------

const eventSchema = z.object({
  name: text("Event name", 120),
  description: optionalText(1000),
});

export async function addEvent(pageantId, _prev, formData) {
  await requireDirector(pageantId);
  const { data, error } = parseForm(eventSchema, formData);
  if (error) return { error };
  await db.event.create({
    data: { ...data, pageantId, sortOrder: await nextSortOrder("event", { pageantId }) },
  });
  refresh(pageantId);
  return { ok: true };
}

export async function updateEvent(pageantId, id, _prev, formData) {
  await requireDirector(pageantId);
  const { data, error } = parseForm(eventSchema, formData);
  if (error) return { error };
  const { count } = await db.event.updateMany({ where: { id, pageantId }, data });
  if (!count) return notFoundError;
  refresh(pageantId);
  return { ok: true, message: "Saved." };
}

export async function deleteEvent(pageantId, id) {
  await requireDirector(pageantId);
  await db.event.deleteMany({ where: { id, pageantId } });
  refresh(pageantId);
  return { ok: true };
}

// ---------- Judging criteria ----------

const criterionSchema = z.object({
  name: text("Criterion name", 120),
  description: optionalText(1000),
  maxScore: intField("Max score", 1, 100),
  weight: numberField("Weight", 0.1, 100),
});

export async function addCriterion(pageantId, eventId, _prev, formData) {
  await requireDirector(pageantId);
  const event = await db.event.findFirst({ where: { id: eventId, pageantId } });
  if (!event) return notFoundError;
  const { data, error } = parseForm(criterionSchema, formData);
  if (error) return { error };
  await db.criterion.create({
    data: { ...data, eventId, sortOrder: await nextSortOrder("criterion", { eventId }) },
  });
  refresh(pageantId);
  return { ok: true };
}

export async function updateCriterion(pageantId, id, _prev, formData) {
  await requireDirector(pageantId);
  const criterion = await db.criterion.findFirst({ where: { id, event: { pageantId } } });
  if (!criterion) return notFoundError;
  const { data, error } = parseForm(criterionSchema, formData);
  if (error) return { error };

  const highest = await db.score.aggregate({ where: { criterionId: id }, _max: { value: true } });
  if (highest._max.value !== null && data.maxScore < highest._max.value) {
    return {
      error: `A judge has already given a score of ${highest._max.value}. Max score can't be lower than that.`,
    };
  }

  await db.criterion.update({ where: { id }, data });
  refresh(pageantId);
  return { ok: true, message: "Saved." };
}

export async function deleteCriterion(pageantId, id) {
  await requireDirector(pageantId);
  await db.criterion.deleteMany({ where: { id, event: { pageantId } } });
  refresh(pageantId);
  return { ok: true };
}

// ---------- Quick comments (canned feedback for judges) ----------

const quickCommentSchema = z.object({ text: text("Comment", QUICK_COMMENT_MAX_LENGTH) });

async function duplicateComment(pageantId, value, exceptId) {
  const existing = await db.quickComment.findMany({ where: { pageantId }, select: { id: true, text: true } });
  return existing.some((c) => c.id !== exceptId && c.text.toLowerCase() === value.toLowerCase());
}

export async function addQuickComment(pageantId, _prev, formData) {
  await requireDirector(pageantId);
  const { data, error } = parseForm(quickCommentSchema, formData);
  if (error) return { error };
  if ((await db.quickComment.count({ where: { pageantId } })) >= QUICK_COMMENT_LIMIT) {
    return { error: `You can have up to ${QUICK_COMMENT_LIMIT} quick comments.` };
  }
  if (await duplicateComment(pageantId, data.text)) return { error: "That comment is already in the list." };
  await db.quickComment.create({
    data: { ...data, pageantId, sortOrder: await nextSortOrder("quickComment", { pageantId }) },
  });
  refresh(pageantId);
  return { ok: true };
}

export async function updateQuickComment(pageantId, id, _prev, formData) {
  await requireDirector(pageantId);
  const { data, error } = parseForm(quickCommentSchema, formData);
  if (error) return { error };
  if (await duplicateComment(pageantId, data.text, id)) return { error: "That comment is already in the list." };
  const { count } = await db.quickComment.updateMany({ where: { id, pageantId }, data });
  if (!count) return notFoundError;
  refresh(pageantId);
  return { ok: true, message: "Saved." };
}

export async function deleteQuickComment(pageantId, id) {
  await requireDirector(pageantId);
  await db.quickComment.deleteMany({ where: { id, pageantId } });
  refresh(pageantId);
  return { ok: true };
}

// Adds any of the suggested defaults that aren't already in the list.
export async function addSuggestedQuickComments(pageantId) {
  await requireDirector(pageantId);
  const existing = await db.quickComment.findMany({ where: { pageantId }, select: { text: true } });
  const have = new Set(existing.map((c) => c.text.toLowerCase()));
  const missing = DEFAULT_QUICK_COMMENTS.filter((t) => !have.has(t.toLowerCase()));
  if (!missing.length) return { ok: true, message: "All suggested comments are already in your list." };
  if (existing.length + missing.length > QUICK_COMMENT_LIMIT) {
    return { error: `Adding these would go over the ${QUICK_COMMENT_LIMIT}-comment limit.` };
  }
  let order = await nextSortOrder("quickComment", { pageantId });
  await db.quickComment.createMany({ data: missing.map((t) => ({ pageantId, text: t, sortOrder: order++ })) });
  refresh(pageantId);
  return { ok: true, message: `Added ${missing.length} suggested comment${missing.length === 1 ? "" : "s"}.` };
}

// ---------- Reordering ----------

const ORDERABLE = {
  ageGroup: (pageantId) => ({ pageantId }),
  question: (pageantId) => ({ pageantId }),
  event: (pageantId) => ({ pageantId }),
  quickComment: (pageantId) => ({ pageantId }),
  criterion: (pageantId, item) => ({ eventId: item.eventId, event: { pageantId } }),
};

export async function moveItem(pageantId, model, id, direction) {
  await requireDirector(pageantId);
  if (!ORDERABLE[model] || !["up", "down"].includes(direction)) return { error: "Invalid move." };

  const scopeFor = ORDERABLE[model];
  const item =
    model === "criterion"
      ? await db.criterion.findFirst({ where: { id, event: { pageantId } } })
      : await db[model].findFirst({ where: { id, pageantId } });
  if (!item) return notFoundError;

  const siblings = await db[model].findMany({
    where: scopeFor(pageantId, item),
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
  });
  const index = siblings.findIndex((s) => s.id === id);
  const swapWith = direction === "up" ? index - 1 : index + 1;
  if (swapWith < 0 || swapWith >= siblings.length) return { ok: true };

  // Renumber so duplicate sortOrder values from older data can't break the swap.
  const ordered = [...siblings];
  [ordered[index], ordered[swapWith]] = [ordered[swapWith], ordered[index]];
  await db.$transaction(
    ordered.map((s, i) => db[model].update({ where: { id: s.id }, data: { sortOrder: i } })),
  );
  refresh(pageantId);
  return { ok: true };
}
