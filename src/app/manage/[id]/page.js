import Link from "next/link";
import { db } from "@/lib/db";
import { requireDirector } from "@/lib/access";
import { toDateInput } from "@/lib/age";
import { STATUS_INFO } from "@/lib/constants";
import { deletePageant, setResultsPublished, setStatus, updatePageant } from "@/app/actions/pageants";
import PageantForm from "@/components/manage/PageantForm";
import { DeletePageant, PublishControl, StatusControl } from "@/components/manage/OverviewControls";
import { Badge, Panel } from "@/components/ui";

export default async function ManageOverview({ params }) {
  const { id } = await params;
  const { pageant } = await requireDirector(id);

  const [ageGroups, questions, events, criteria, registered, pendingContestants, judges, quickComments] = await Promise.all([
    db.ageGroup.count({ where: { pageantId: id } }),
    db.question.count({ where: { pageantId: id } }),
    db.event.count({ where: { pageantId: id } }),
    db.criterion.count({ where: { event: { pageantId: id } } }),
    db.contestant.count({ where: { pageantId: id, registeredAt: { not: null } } }),
    db.contestant.count({ where: { pageantId: id, registeredAt: null } }),
    db.judge.count({ where: { pageantId: id } }),
    db.quickComment.count({ where: { pageantId: id } }),
  ]);

  const checklist = [
    { done: ageGroups > 0, label: "Define age groups", detail: `${ageGroups} defined`, href: "age-groups" },
    { done: questions > 0, label: "Write bio questions", detail: `${questions} questions`, href: "questions" },
    { done: events > 0 && criteria > 0, label: "Set up events and judging criteria", detail: `${events} events, ${criteria} criteria`, href: "events" },
    {
      done: quickComments > 0,
      label: "Review quick comments for judges",
      detail: `${quickComments} comments (starts with 8 defaults; edit to suit your pageant)`,
      href: "comments",
    },
    { done: judges > 0, label: "Invite judges", detail: `${judges} judges`, href: "people" },
    {
      done: registered > 0,
      label: "Invite contestants",
      detail: `${registered} registered${pendingContestants ? `, ${pendingContestants} in progress` : ""}`,
      href: "people",
    },
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="grid gap-6 lg:col-span-2 content-start">
        <Panel title="Pageant status" description={STATUS_INFO[pageant.status].help}>
          <StatusControl status={pageant.status} action={setStatus.bind(null, id)} />
          {pageant.status === "COMPLETE" && (
            <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-stone-100 pt-5">
              <PublishControl published={pageant.resultsPublished} action={setResultsPublished.bind(null, id)} />
              {pageant.resultsPublished && <Badge tone="green">Results visible to contestants</Badge>}
            </div>
          )}
        </Panel>

        <Panel title="Details">
          <PageantForm
            action={updatePageant.bind(null, id)}
            pageant={{ ...pageant, eventDateInput: toDateInput(pageant.eventDate) }}
            showSuccess
          />
        </Panel>
      </div>

      <div className="grid gap-6 content-start">
        <Panel title="Setup checklist">
          <ul className="flex flex-col gap-3">
            {checklist.map((item) => (
              <li key={item.label} className="flex items-start gap-3">
                <span
                  aria-hidden
                  className={`mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full text-xs ${
                    item.done ? "bg-emerald-100 text-emerald-700" : "bg-stone-100 text-stone-400"
                  }`}
                >
                  {item.done ? "✓" : "·"}
                </span>
                <div>
                  <Link href={`/manage/${id}/${item.href}`} className="text-sm font-medium text-stone-800 hover:text-plum-700">
                    {item.label}
                  </Link>
                  <p className="text-xs text-stone-500">{item.detail}</p>
                </div>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Danger zone">
          <p className="mb-3 text-sm text-stone-600">Deleting a pageant removes all of its data permanently.</p>
          <DeletePageant action={deletePageant.bind(null, id)} name={pageant.name} />
        </Panel>
      </div>
    </div>
  );
}
