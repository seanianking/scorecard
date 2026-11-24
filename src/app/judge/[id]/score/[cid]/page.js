import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireJudge } from "@/lib/access";
import { ageOn, eligibilityDate } from "@/lib/age";
import { judgingOrder } from "@/lib/judging";
import { photoUrl } from "@/lib/photos";
import ContestantPhoto from "@/components/ContestantPhoto";
import { saveScores } from "@/app/actions/judging";
import ScoreSheet from "@/components/judge/ScoreSheet";
import { Notice, Panel } from "@/components/ui";

export const metadata = { title: "Score contestant" };

export default async function ScorePage({ params, searchParams }) {
  const { id, cid } = await params;
  const { event: eventParam } = await searchParams;
  const { judge, pageant } = await requireJudge(id);

  const [event, { contestants }, questions, quickComments] = await Promise.all([
    db.event.findFirst({
      where: { id: String(eventParam ?? ""), pageantId: id },
      include: { criteria: { orderBy: [{ sortOrder: "asc" }, { id: "asc" }] } },
    }),
    judgingOrder(id),
    db.question.findMany({ where: { pageantId: id }, orderBy: [{ sortOrder: "asc" }, { id: "asc" }] }),
    db.quickComment.findMany({
      where: { pageantId: id },
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
      select: { id: true, text: true },
    }),
  ]);
  const index = contestants.findIndex((c) => c.id === cid);
  if (!event || index === -1) notFound();
  const contestant = contestants[index];
  const next = contestants[index + 1];
  const prev = contestants[index - 1];

  const [ageGroup, answers, scores, feedback] = await Promise.all([
    contestant.ageGroupId ? db.ageGroup.findUnique({ where: { id: contestant.ageGroupId } }) : null,
    db.answer.findMany({ where: { contestantId: cid } }),
    db.score.findMany({ where: { judgeId: judge.id, contestantId: cid, criterion: { eventId: event.id } } }),
    db.feedback.findUnique({
      where: { judgeId_contestantId_eventId: { judgeId: judge.id, contestantId: cid, eventId: event.id } },
    }),
  ]);
  const answerMap = new Map(answers.map((a) => [a.questionId, a.value]));
  const scoreMap = Object.fromEntries(event.criteria.map((c) => [c.id, ""]));
  for (const s of scores) scoreMap[s.criterionId] = String(s.value);
  const locked = pageant.status !== "JUDGING";
  const q = `?event=${event.id}`;

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <Link href={`/judge/${id}${q}`} className="text-plum-700 hover:underline">
          ← {event.name}: all contestants
        </Link>
        <div className="flex gap-4">
          {prev && (
            <Link href={`/judge/${id}/score/${prev.id}${q}`} className="text-stone-600 hover:text-stone-900">
              ← #{prev.contestantNumber} {prev.displayName}
            </Link>
          )}
          {next && (
            <Link href={`/judge/${id}/score/${next.id}${q}`} className="text-stone-600 hover:text-stone-900">
              #{next.contestantNumber} {next.displayName} →
            </Link>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <Panel
            title={
              <span className="flex items-center gap-4">
                {photoUrl(contestant) ? (
                  <a href={photoUrl(contestant)} target="_blank" rel="noopener" title="Open full-size photo">
                    <ContestantPhoto url={photoUrl(contestant)} name={contestant.displayName} size="lg" />
                  </a>
                ) : (
                  <ContestantPhoto name={contestant.displayName} size="lg" />
                )}
                <span className="flex flex-col">
                  <span className="font-display text-4xl text-stone-400">#{contestant.contestantNumber}</span>
                  <span className="font-display text-2xl">{contestant.displayName}</span>
                  <span className="mt-1 text-sm font-normal text-stone-500">
                    {event.name}
                    {ageGroup ? ` · ${ageGroup.name}` : ""}
                  </span>
                  {!contestant.photoKey && (
                    <span className="mt-1 text-xs font-normal text-amber-700">No photo on file</span>
                  )}
                </span>
              </span>
            }
          >
            {locked && (
              <div className="mb-4">
                <Notice tone="amber">
                  {pageant.status === "COMPLETE" ? "Judging is complete, so scores are locked." : "Scoring hasn't opened yet."}
                </Notice>
              </div>
            )}
            {event.criteria.length ? (
              <ScoreSheet
                key={`${cid}:${event.id}`}
                action={saveScores.bind(null, id, cid, event.id)}
                criteria={event.criteria.map(({ id, name, description, maxScore, weight }) => ({ id, name, description, maxScore, weight }))}
                initialScores={scoreMap}
                initialFeedback={feedback?.comment ?? ""}
                quickComments={quickComments}
                nextContestantId={next?.id}
                locked={locked}
              />
            ) : (
              <p className="text-sm text-stone-500">This event has no criteria yet.</p>
            )}
          </Panel>
        </div>

        <div className="lg:col-span-2">
          <Panel title="Contestant bio">
            <dl className="grid gap-3 text-sm">
              {contestant.dateOfBirth && (
                <div>
                  <dt className="text-stone-500">Age</dt>
                  <dd>{ageOn(contestant.dateOfBirth, eligibilityDate(pageant))}</dd>
                </div>
              )}
              {questions.map((qq) => (
                <div key={qq.id}>
                  <dt className="text-stone-500">{qq.prompt}</dt>
                  <dd className="mt-0.5 whitespace-pre-wrap text-stone-900">
                    {answerMap.get(qq.id) || <span className="text-stone-400">No answer</span>}
                  </dd>
                </div>
              ))}
            </dl>
          </Panel>
        </div>
      </div>
    </div>
  );
}
