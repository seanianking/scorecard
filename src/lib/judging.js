import "server-only";
import { db } from "./db";

// Registered contestants in judging order: by age group order, then contestant number.
export async function judgingOrder(pageantId) {
  const [ageGroups, contestants] = await Promise.all([
    db.ageGroup.findMany({ where: { pageantId }, orderBy: [{ sortOrder: "asc" }, { id: "asc" }] }),
    db.contestant.findMany({
      where: { pageantId, registeredAt: { not: null } },
      orderBy: [{ contestantNumber: "asc" }, { createdAt: "asc" }],
    }),
  ]);
  const groupIndex = new Map(ageGroups.map((g, i) => [g.id, i]));
  const ordered = [...contestants].sort(
    (a, b) => (groupIndex.get(a.ageGroupId) ?? 1e9) - (groupIndex.get(b.ageGroupId) ?? 1e9),
  );
  return { ageGroups, contestants: ordered };
}
