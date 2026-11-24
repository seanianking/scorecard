import { db } from "@/lib/db";
import { requireContestant } from "@/lib/access";
import { ageOn, eligibilityDate, formatDate } from "@/lib/age";
import { loadResults } from "@/lib/results";
import { photoUrl } from "@/lib/photos";
import ContestantPhoto from "@/components/ContestantPhoto";
import { ButtonLink, Notice, Panel } from "@/components/ui";

const STATUS_MESSAGE = {
  SETUP: "The director is still setting things up. Registration will open soon.",
  REGISTRATION: "Registration is open. You can edit your entry until it closes.",
  JUDGING: "Registration is closed and judging is underway. Good luck!",
  COMPLETE: "Judging is complete. Results will appear here once the director publishes them.",
};

export default async function CompeteHome({ params, searchParams }) {
  const { id } = await params;
  const { saved } = await searchParams;
  const { contestant, pageant } = await requireContestant(id);

  const [ageGroup, questions, answers] = await Promise.all([
    contestant.ageGroupId ? db.ageGroup.findUnique({ where: { id: contestant.ageGroupId } }) : null,
    db.question.findMany({ where: { pageantId: id }, orderBy: [{ sortOrder: "asc" }, { id: "asc" }] }),
    db.answer.findMany({ where: { contestantId: contestant.id } }),
  ]);
  const answerMap = new Map(answers.map((a) => [a.questionId, a.value]));
  const showResults = pageant.resultsPublished && pageant.status === "COMPLETE" && contestant.registeredAt;

  let result = null;
  let feedbackByEvent = new Map();
  if (showResults) {
    const [{ rows, groups }, feedback, judges] = await Promise.all([
      loadResults(id),
      db.feedback.findMany({ where: { contestantId: contestant.id } }),
      db.judge.findMany({ where: { pageantId: id }, orderBy: { createdAt: "asc" }, select: { id: true } }),
    ]);
    result = rows.find((r) => r.contestant.id === contestant.id);
    result.groupSize = groups.get(contestant.ageGroupId ?? "none")?.length ?? 0;
    // Feedback is anonymized as "Judge 1", "Judge 2", ...
    const judgeNumber = new Map(judges.map((j, i) => [j.id, i + 1]));
    for (const f of feedback) {
      if (!feedbackByEvent.has(f.eventId)) feedbackByEvent.set(f.eventId, []);
      feedbackByEvent.get(f.eventId).push({ ...f, judgeNumber: judgeNumber.get(f.judgeId) });
    }
  }

  return (
    <div className="grid gap-6">
      {saved && <Notice tone="green">Your registration has been saved.</Notice>}
      {!contestant.registeredAt && pageant.status === "REGISTRATION" ? (
        <Panel title="Finish registering">
          <p className="mb-4 text-sm text-stone-600">
            You've accepted the invitation. Now choose your age group and tell the judges about yourself.
          </p>
          <ButtonLink href={`/compete/${id}/register`}>Complete registration</ButtonLink>
        </Panel>
      ) : (
        <Notice tone={showResults ? "green" : pageant.status === "REGISTRATION" ? "plum" : "amber"}>
          {contestant.registeredAt
            ? showResults
              ? "Final results are in. Thank you for competing!"
              : STATUS_MESSAGE[pageant.status]
            : "You didn't complete your registration before it closed. Contact the director."}
        </Notice>
      )}

      {result && (
        <Panel title="Your results">
          <div className="flex flex-wrap items-end gap-8">
            <div>
              <p className="font-display text-5xl text-plum-800">#{result.rank}</p>
              <p className="text-sm text-stone-600">
                of {result.groupSize} in {ageGroup?.name}
              </p>
            </div>
            <div>
              <p className="text-2xl font-semibold tabular-nums text-stone-900">{result.percent}%</p>
              <p className="text-sm text-stone-600">
                {result.totalPoints} of {result.totalPossible} points
              </p>
            </div>
          </div>
          <div className="mt-6 grid gap-5">
            {result.events.map((e) => (
              <div key={e.eventId} className="border-t border-stone-100 pt-4">
                <div className="flex items-baseline justify-between">
                  <h3 className="font-semibold text-stone-900">{e.name}</h3>
                  <span className="text-sm tabular-nums text-stone-600">
                    {e.points} / {e.possible}
                  </span>
                </div>
                <ul className="mt-2 grid gap-1 text-sm">
                  {e.criteria.map((c) => (
                    <li key={c.criterionId} className="flex justify-between text-stone-700">
                      <span>{c.name}</span>
                      <span className="tabular-nums">
                        {c.average ?? "—"} / {c.maxScore}
                      </span>
                    </li>
                  ))}
                </ul>
                {(feedbackByEvent.get(e.eventId) ?? []).map((f) => (
                  <blockquote key={f.id} className="mt-3 rounded-lg bg-plum-50 p-3 text-sm">
                    <p className="whitespace-pre-wrap text-stone-800">{f.comment}</p>
                    <footer className="mt-1 text-xs text-stone-500">Judge {f.judgeNumber}</footer>
                  </blockquote>
                ))}
              </div>
            ))}
          </div>
        </Panel>
      )}

      {contestant.registeredAt && (
        <Panel
          title="Your registration"
          actions={
            pageant.status === "REGISTRATION" && (
              <ButtonLink href={`/compete/${id}/register`} variant="secondary">
                Edit
              </ButtonLink>
            )
          }
        >
          <dl className="grid gap-4 text-sm">
            <div className="flex items-center gap-4">
              <ContestantPhoto url={photoUrl(contestant)} name={contestant.displayName} size="lg" />
              {!contestant.photoKey && (
                <p className="text-stone-500">
                  No photo yet.{pageant.status === "REGISTRATION" && " Add one so judges can recognize you."}
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <dt className="text-stone-500">Name</dt>
                <dd className="font-medium">{contestant.displayName}</dd>
              </div>
              <div>
                <dt className="text-stone-500">Contestant #</dt>
                <dd className="font-medium">{contestant.contestantNumber ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-stone-500">Age group</dt>
                <dd className="font-medium">{ageGroup?.name ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-stone-500">Age on {formatDate(eligibilityDate(pageant))}</dt>
                <dd className="font-medium">{contestant.dateOfBirth ? ageOn(contestant.dateOfBirth, eligibilityDate(pageant)) : "—"}</dd>
              </div>
            </div>
            {questions.map((q) => (
              <div key={q.id}>
                <dt className="text-stone-500">{q.prompt}</dt>
                <dd className="mt-0.5 whitespace-pre-wrap">{answerMap.get(q.id) || <span className="text-stone-400">No answer</span>}</dd>
              </div>
            ))}
          </dl>
        </Panel>
      )}
    </div>
  );
}
