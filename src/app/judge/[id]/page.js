import Link from "next/link";
import { db } from "@/lib/db";
import { requireJudge } from "@/lib/access";
import { judgingOrder } from "@/lib/judging";
import { photoUrl } from "@/lib/photos";
import ContestantPhoto from "@/components/ContestantPhoto";
import { Badge, EmptyState, Notice, Panel } from "@/components/ui";

const STATUS_NOTICE = {
  SETUP: "The pageant is still being set up. Scoring opens when the director starts judging.",
  REGISTRATION: "Contestants are still registering. Scoring opens when the director starts judging. You can preview contestants below.",
  COMPLETE: "Judging is complete. Your scores are locked.",
};

export default async function JudgeHome({ params, searchParams }) {
  const { id } = await params;
  const { event: eventParam } = await searchParams;
  const { judge, pageant } = await requireJudge(id);

  const events = await db.event.findMany({
    where: { pageantId: id },
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    include: { criteria: { select: { id: true } } },
  });
  if (!events.length) {
    return <EmptyState title="No events yet">The director hasn't set up any events to judge.</EmptyState>;
  }
  const event = events.find((e) => e.id === eventParam) ?? events[0];

  const [{ ageGroups, contestants }, myScores, myFeedback] = await Promise.all([
    judgingOrder(id),
    db.score.findMany({
      where: { judgeId: judge.id, criterion: { eventId: event.id } },
      select: { contestantId: true },
    }),
    db.feedback.findMany({ where: { judgeId: judge.id, eventId: event.id }, select: { contestantId: true } }),
  ]);
  const scoredCount = new Map();
  for (const s of myScores) scoredCount.set(s.contestantId, (scoredCount.get(s.contestantId) ?? 0) + 1);
  const hasFeedback = new Set(myFeedback.map((f) => f.contestantId));
  const criteriaCount = event.criteria.length;
  const done = contestants.filter((c) => criteriaCount > 0 && scoredCount.get(c.id) === criteriaCount).length;

  const sections = [
    ...ageGroups.map((g) => ({ key: g.id, title: g.name, list: contestants.filter((c) => c.ageGroupId === g.id) })),
    { key: "none", title: "No age group", list: contestants.filter((c) => !c.ageGroupId) },
  ].filter((s) => s.list.length);

  return (
    <div className="grid gap-6">
      {STATUS_NOTICE[pageant.status] && <Notice tone="amber">{STATUS_NOTICE[pageant.status]}</Notice>}

      <nav className="flex flex-wrap gap-2" aria-label="Events">
        {events.map((e) => (
          <Link
            key={e.id}
            href={`/judge/${id}?event=${e.id}`}
            aria-current={e.id === event.id ? "page" : undefined}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${
              e.id === event.id ? "bg-plum-700 text-white" : "border border-stone-300 bg-white text-stone-700 hover:bg-stone-50"
            }`}
          >
            {e.name}
          </Link>
        ))}
      </nav>

      <p className="text-sm text-stone-600">
        {criteriaCount === 0
          ? "This event has no criteria yet."
          : `${done} of ${contestants.length} contestants fully scored for ${event.name}.`}
      </p>

      {sections.length === 0 && <EmptyState title="No registered contestants yet" />}

      {sections.map((s) => (
        <Panel key={s.key} title={s.title}>
          <ul className="-mx-5 divide-y divide-stone-100">
            {s.list.map((c) => {
              const n = scoredCount.get(c.id) ?? 0;
              return (
                <li key={c.id}>
                  <Link
                    href={`/judge/${id}/score/${c.id}?event=${event.id}`}
                    className="flex items-center gap-4 px-5 py-3 hover:bg-stone-50"
                  >
                    <span className="w-10 text-right font-display text-xl text-stone-400">{c.contestantNumber}</span>
                    <ContestantPhoto url={photoUrl(c)} name={c.displayName} size="md" />
                    <span className="flex-1 font-medium text-stone-900">{c.displayName}</span>
                    {hasFeedback.has(c.id) && <Badge>Feedback</Badge>}
                    {criteriaCount > 0 &&
                      (n === criteriaCount ? (
                        <Badge tone="green">Scored</Badge>
                      ) : n > 0 ? (
                        <Badge tone="amber">
                          {n}/{criteriaCount}
                        </Badge>
                      ) : (
                        <Badge>Not scored</Badge>
                      ))}
                  </Link>
                </li>
              );
            })}
          </ul>
        </Panel>
      ))}
    </div>
  );
}
