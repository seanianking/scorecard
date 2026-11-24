import "server-only";
import { db } from "./db";
import { computeResults } from "./scoring";

// Loads everything needed to score a pageant and runs the scoring engine.
export async function loadResults(pageantId) {
  const [events, ageGroups, contestants, judges, scores] = await Promise.all([
    db.event.findMany({
      where: { pageantId },
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
      include: { criteria: { orderBy: [{ sortOrder: "asc" }, { id: "asc" }] } },
    }),
    db.ageGroup.findMany({ where: { pageantId }, orderBy: [{ sortOrder: "asc" }, { id: "asc" }] }),
    db.contestant.findMany({ where: { pageantId, registeredAt: { not: null } } }),
    db.judge.findMany({ where: { pageantId }, select: { id: true } }),
    db.score.findMany({
      where: { contestant: { pageantId } },
      select: { judgeId: true, contestantId: true, criterionId: true, value: true },
    }),
  ]);
  const { rows, groups } = computeResults({ events, contestants, scores, judgeCount: judges.length });
  return { events, ageGroups, rows, groups, judgeCount: judges.length };
}
