import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { readPhoto } from "@/lib/photos";

const notFound = () => new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });

// Serves a contestant's photo only to the pageant's director, its judges, or the contestant.
export async function GET(_request, { params }) {
  const { contestantId } = await params;
  const user = await getCurrentUser();
  if (!user) return notFound();

  const contestant = await db.contestant.findUnique({
    where: { id: contestantId },
    select: {
      userId: true,
      photoKey: true,
      pageant: { select: { directorId: true, judges: { where: { userId: user.id }, select: { id: true } } } },
    },
  });
  if (!contestant?.photoKey) return notFound();

  const allowed =
    contestant.userId === user.id ||
    contestant.pageant.directorId === user.id ||
    contestant.pageant.judges.length > 0;
  if (!allowed) return notFound();

  const data = await readPhoto(contestant.photoKey);
  if (!data) return notFound();

  return new Response(data, {
    headers: {
      "Content-Type": "image/jpeg",
      // URLs carry a ?v= version, so browsers may cache privately; shared caches must not.
      "Cache-Control": "private, max-age=86400",
      "Content-Disposition": "inline",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
