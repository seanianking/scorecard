import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireDirector } from "@/lib/access";
import { ageOn, eligibilityDate, formatDate } from "@/lib/age";
import { loadResults } from "@/lib/results";
import { photoUrl } from "@/lib/photos";
import { removeContestantPhoto, uploadContestantPhoto } from "@/app/actions/photos";
import PhotoUploader from "@/components/PhotoUploader";
import { removeContestant, updateContestant } from "@/app/actions/people";
import { ContestantAdminForm, RemoveButton } from "@/components/manage/PeopleEditors";
import { Badge, Panel } from "@/components/ui";

export const metadata = { title: "Contestant" };

export default async function ContestantDetail({ params }) {
  const { id, cid } = await params;
  const { pageant } = await requireDirector(id);

  const contestant = await db.contestant.findFirst({
    where: { id: cid, pageantId: id },
    include: {
      user: { select: { email: true } },
      ageGroup: true,
      answers: true,
      scores: { include: { judge: { include: { user: { select: { name: true } } } } } },
      feedback: { include: { judge: { include: { user: { select: { name: true } } } } } },
    },
  });
  if (!contestant) notFound();

  const [questions, ageGroups, judges, { rows, events }] = await Promise.all([
    db.question.findMany({ where: { pageantId: id }, orderBy: [{ sortOrder: "asc" }, { id: "asc" }] }),
    db.ageGroup.findMany({ where: { pageantId: id }, orderBy: [{ sortOrder: "asc" }, { id: "asc" }] }),
    db.judge.findMany({ where: { pageantId: id }, include: { user: { select: { name: true } } }, orderBy: { createdAt: "asc" } }),
    loadResults(id),
  ]);
  const result = rows.find((r) => r.contestant.id === cid);
  const answers = new Map(contestant.answers.map((a) => [a.questionId, a.value]));
  const scoreKey = (judgeId, criterionId) => `${judgeId}:${criterionId}`;
  const scores = new Map(contestant.scores.map((s) => [scoreKey(s.judgeId, s.criterionId), s.value]));

  return (
    <div className="grid gap-6">
      <Link href={`/manage/${id}/people`} className="text-sm text-plum-700 hover:underline">
        ← All contestants
      </Link>

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title={contestant.displayName || contestant.user.email} className="lg:col-span-2">
          <div className="mb-5 border-b border-stone-100 pb-5">
            <PhotoUploader
              uploadAction={uploadContestantPhoto.bind(null, id, cid)}
              removeAction={removeContestantPhoto.bind(null, id, cid)}
              url={photoUrl(contestant)}
              name={contestant.displayName || contestant.user.email}
              hint="Judges see this photo while scoring. As director you can replace it any time, for example with a photo taken at check-in."
            />
          </div>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-4">
            <div>
              <dt className="text-stone-500">Email</dt>
              <dd className="break-all">{contestant.user.email}</dd>
            </div>
            <div>
              <dt className="text-stone-500">Date of birth</dt>
              <dd>{contestant.dateOfBirth ? formatDate(contestant.dateOfBirth) : "—"}</dd>
            </div>
            <div>
              <dt className="text-stone-500">Age on event day</dt>
              <dd>{contestant.dateOfBirth ? ageOn(contestant.dateOfBirth, eligibilityDate(pageant)) : "—"}</dd>
            </div>
            <div>
              <dt className="text-stone-500">Status</dt>
              <dd>{contestant.registeredAt ? <Badge tone="green">Registered</Badge> : <Badge tone="amber">Not submitted</Badge>}</dd>
            </div>
          </dl>
          <div className="mt-5 border-t border-stone-100 pt-5">
            <ContestantAdminForm
              action={updateContestant.bind(null, id, cid)}
              contestant={contestant}
              ageGroups={ageGroups}
            />
          </div>
        </Panel>

        <Panel title="Standing">
          {result ? (
            <div className="text-sm">
              <p className="font-display text-4xl text-plum-800">#{result.rank}</p>
              <p className="text-stone-600">in {contestant.ageGroup?.name ?? "unassigned"}</p>
              <p className="mt-3">
                {result.totalPoints} / {result.totalPossible} points ({result.percent}%)
              </p>
              <p className="text-xs text-stone-500">{Math.round(result.completeness * 100)}% of scores entered</p>
            </div>
          ) : (
            <p className="text-sm text-stone-500">Not ranked until registration is submitted.</p>
          )}
          <div className="mt-5 border-t border-stone-100 pt-4">
            <RemoveButton
              action={removeContestant.bind(null, id, cid)}
              confirm="Remove this contestant from the pageant? Their registration, scores and feedback will be deleted."
              label="Remove from pageant"
            />
          </div>
        </Panel>
      </div>

      <Panel title="Bio">
        {questions.length ? (
          <dl className="grid gap-4">
            {questions.map((q) => (
              <div key={q.id}>
                <dt className="text-sm font-medium text-stone-700">{q.prompt}</dt>
                <dd className="mt-0.5 whitespace-pre-wrap text-sm text-stone-900">
                  {answers.get(q.id) || <span className="text-stone-400">No answer</span>}
                </dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="text-sm text-stone-500">This pageant has no bio questions.</p>
        )}
      </Panel>

      {events.map((event) => {
        const feedback = contestant.feedback.filter((f) => f.eventId === event.id);
        const eventResult = result?.events.find((e) => e.eventId === event.id);
        return (
          <Panel
            key={event.id}
            title={event.name}
            description={eventResult ? `${eventResult.points} / ${eventResult.possible} points (${eventResult.percent}%)` : undefined}
          >
            {event.criteria.length && judges.length ? (
              <div className="-mx-5 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-xs uppercase tracking-wide text-stone-500">
                    <tr>
                      <th className="px-5 py-2 font-medium">Criterion</th>
                      {judges.map((j) => (
                        <th key={j.id} className="px-3 py-2 font-medium">{j.user.name}</th>
                      ))}
                      <th className="px-5 py-2 font-medium">Average</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {event.criteria.map((c) => {
                      const avg = eventResult?.criteria.find((x) => x.criterionId === c.id)?.average;
                      return (
                        <tr key={c.id}>
                          <td className="px-5 py-2">
                            {c.name} <span className="text-xs text-stone-400">/ {c.maxScore}{c.weight !== 1 && ` × ${c.weight}`}</span>
                          </td>
                          {judges.map((j) => (
                            <td key={j.id} className="px-3 py-2 tabular-nums">
                              {scores.get(scoreKey(j.id, c.id)) ?? <span className="text-stone-300">—</span>}
                            </td>
                          ))}
                          <td className="px-5 py-2 font-medium tabular-nums">{avg ?? "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-stone-500">No criteria or judges yet.</p>
            )}
            {feedback.length > 0 && (
              <div className="mt-4 grid gap-3 border-t border-stone-100 pt-4">
                {feedback.map((f) => (
                  <blockquote key={f.id} className="rounded-lg bg-stone-50 p-3 text-sm">
                    <p className="whitespace-pre-wrap text-stone-800">{f.comment}</p>
                    <footer className="mt-1 text-xs text-stone-500">{f.judge.user.name}</footer>
                  </blockquote>
                ))}
              </div>
            )}
          </Panel>
        );
      })}
    </div>
  );
}
