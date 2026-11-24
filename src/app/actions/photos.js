"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireContestant, requireDirector } from "@/lib/access";
import { deletePhoto, PhotoError, savePhoto } from "@/lib/photos";

function refresh(pageantId) {
  for (const area of ["manage", "judge", "compete"]) revalidatePath(`/${area}/${pageantId}`, "layout");
}

async function replacePhoto(contestant, file) {
  let key;
  try {
    key = await savePhoto(file);
  } catch (e) {
    if (e instanceof PhotoError) return { error: e.message };
    console.error("Photo upload failed", e);
    return { error: "The photo couldn't be saved. Please try again." };
  }
  await db.contestant.update({
    where: { id: contestant.id },
    data: { photoKey: key, photoUpdatedAt: new Date() },
  });
  await deletePhoto(contestant.photoKey);
  refresh(contestant.pageantId);
  return { ok: true, message: "Photo saved." };
}

async function clearPhoto(contestant) {
  await db.contestant.update({ where: { id: contestant.id }, data: { photoKey: null, photoUpdatedAt: new Date() } });
  await deletePhoto(contestant.photoKey);
  refresh(contestant.pageantId);
  return { ok: true, message: "Photo removed." };
}

// ----- Contestant: only while registration is open (same rule as the rest of their bio)

export async function uploadMyPhoto(pageantId, _prev, formData) {
  const { contestant, pageant } = await requireContestant(pageantId);
  if (pageant.status !== "REGISTRATION") return { error: "Registration is closed, so your photo can't be changed." };
  return replacePhoto(contestant, formData.get("photo"));
}

export async function removeMyPhoto(pageantId) {
  const { contestant, pageant } = await requireContestant(pageantId);
  if (pageant.status !== "REGISTRATION") return { error: "Registration is closed, so your photo can't be changed." };
  return clearPhoto(contestant);
}

// ----- Director: any time, e.g. taking a photo at check-in

async function directorContestant(pageantId, contestantId) {
  await requireDirector(pageantId);
  return db.contestant.findFirst({ where: { id: contestantId, pageantId } });
}

export async function uploadContestantPhoto(pageantId, contestantId, _prev, formData) {
  const contestant = await directorContestant(pageantId, contestantId);
  if (!contestant) return { error: "That contestant no longer exists." };
  return replacePhoto(contestant, formData.get("photo"));
}

export async function removeContestantPhoto(pageantId, contestantId) {
  const contestant = await directorContestant(pageantId, contestantId);
  if (!contestant) return { error: "That contestant no longer exists." };
  return clearPhoto(contestant);
}
