import Link from "next/link";
import { db } from "@/lib/db";
import { requireDirector } from "@/lib/access";
import { ageOn, eligibilityDate } from "@/lib/age";
import { photoUrl } from "@/lib/photos";
import ContestantPhoto from "@/components/ContestantPhoto";
import { createInvite, removeJudge, revokeInvite } from "@/app/actions/people";
import { CreateInvite, RemoveButton, RevokeInvite } from "@/components/manage/PeopleEditors";
import { CopyButton } from "@/components/forms";
import { Badge, EmptyState, Notice, Panel } from "@/components/ui";

export const metadata = { title: "Contestants & judges" };

function inviteState(invite) {
  if (invite.revokedAt) return { label: "Revoked", tone: "red", active: false };
  if (invite.singleUse && invite.uses > 0) return { label: "Used", tone: "green", active: false };
  return { label: invite.singleUse ? "Unused" : `Reusable · ${invite.uses} joined`, tone: "plum", active: true };
}

export default async function PeoplePage({ params }) {
  const { id } = await params;
  const { pageant } = await requireDirector(id);

  const [invites, contestants, judges, criteriaCount] = await Promise.all([
    db.invite.findMany({ where: { pageantId: id }, orderBy: { createdAt: "desc" } }),
    db.contestant.findMany({
      where: { pageantId: id },
      include: { ageGroup: true, user: { select: { email: true } } },
      orderBy: [{ contestantNumber: "asc" }, { createdAt: "asc" }],
    }),
    db.judge.findMany({
      where: { pageantId: id },
      include: { user: { select: { name: true, email: true } }, _count: { select: { scores: true } } },
      orderBy: { createdAt: "asc" },
    }),
    db.criterion.count({ where: { event: { pageantId: id } } }),
  ]);

  const registered = contestants.filter((c) => c.registeredAt);
  const expectedPerJudge = registered.length * criteriaCount;
  const asOf = eligibilityDate(pageant);
  const activeInvites = invites.filter((i) => inviteState(i).active);
  const pastInvites = invites.filter((i) => !inviteState(i).active);

  return (
    <div className="grid gap-6">
      <Panel
        title="Invite links"
        description="Send a link to a contestant or judge. They'll create an account (or sign in) and join this pageant."
      >
        {pageant.status !== "REGISTRATION" && (
          <div className="mb-4">
            <Notice tone="amber">
              Contestants can only accept invites while registration is open. Judge invites work until the
              pageant is complete.
            </Notice>
          </div>
        )}
        <CreateInvite action={createInvite.bind(null, id)} />
        {activeInvites.length > 0 && (
          <ul className="mt-5 divide-y divide-stone-100 border-t border-stone-100">
            {activeInvites.map((inv) => {
              const state = inviteState(inv);
              const path = `/invite/${inv.token}`;
              return (
                <li key={inv.id} className="flex flex-wrap items-center gap-3 py-3">
                  <Badge tone={inv.role === "JUDGE" ? "amber" : "neutral"}>{inv.role === "JUDGE" ? "Judge" : "Contestant"}</Badge>
                  <span className="min-w-0 flex-1 text-sm text-stone-700">
                    {inv.label || <span className="text-stone-400">No label</span>}
                    <code className="ml-2 hidden truncate text-xs text-stone-400 md:inline">{path}</code>
                  </span>
                  <Badge tone={state.tone}>{state.label}</Badge>
                  <CopyButton text={path} />
                  <RevokeInvite action={revokeInvite.bind(null, id, inv.id)} />
                </li>
              );
            })}
          </ul>
        )}
        {pastInvites.length > 0 && (
          <details className="mt-4 text-sm">
            <summary className="cursor-pointer text-stone-500">Used and revoked invites ({pastInvites.length})</summary>
            <ul className="mt-2 divide-y divide-stone-100">
              {pastInvites.map((inv) => {
                const state = inviteState(inv);
                return (
                  <li key={inv.id} className="flex items-center gap-3 py-2 text-stone-500">
                    <span className="flex-1">
                      {inv.role === "JUDGE" ? "Judge" : "Contestant"}: {inv.label || "No label"}
                    </span>
                    <Badge tone={state.tone}>{state.label}</Badge>
                  </li>
                );
              })}
            </ul>
          </details>
        )}
      </Panel>

      <Panel title={`Contestants (${registered.length} registered)`}>
        {contestants.length ? (
          <div className="-mx-5 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-stone-500">
                <tr>
                  <th className="px-5 py-2 font-medium">#</th>
                  <th className="px-5 py-2 font-medium">Name</th>
                  <th className="px-5 py-2 font-medium">Age group</th>
                  <th className="px-5 py-2 font-medium">Age</th>
                  <th className="px-5 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {contestants.map((c) => (
                  <tr key={c.id} className="hover:bg-stone-50">
                    <td className="px-5 py-2.5 text-stone-500">{c.contestantNumber ?? "—"}</td>
                    <td className="px-5 py-2.5">
                      <div className="flex items-center gap-3">
                        <ContestantPhoto url={photoUrl(c)} name={c.displayName || c.user.email} size="sm" />
                        <div>
                          <Link href={`/manage/${id}/contestants/${c.id}`} className="font-medium text-plum-800 hover:underline">
                            {c.displayName || c.user.email}
                          </Link>
                          <div className="text-xs text-stone-500">{c.user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-2.5">{c.ageGroup?.name ?? <span className="text-stone-400">—</span>}</td>
                    <td className="px-5 py-2.5">{c.dateOfBirth ? ageOn(c.dateOfBirth, asOf) : "—"}</td>
                    <td className="px-5 py-2.5">
                      {c.registeredAt ? <Badge tone="green">Registered</Badge> : <Badge tone="amber">Not submitted</Badge>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="No contestants yet">Create a contestant invite link above and share it.</EmptyState>
        )}
      </Panel>

      <Panel title={`Judges (${judges.length})`}>
        {judges.length ? (
          <ul className="divide-y divide-stone-100">
            {judges.map((j) => (
              <li key={j.id} className="flex flex-wrap items-center gap-3 py-3">
                <div className="flex-1">
                  <p className="font-medium text-stone-800">{j.user.name}</p>
                  <p className="text-xs text-stone-500">{j.user.email}</p>
                </div>
                {expectedPerJudge > 0 && (
                  <span className="text-xs text-stone-500">
                    {j._count.scores} / {expectedPerJudge} scores entered
                  </span>
                )}
                <RemoveButton
                  action={removeJudge.bind(null, id, j.id)}
                  confirm={`Remove ${j.user.name} as a judge? Their scores and feedback will be deleted.`}
                />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="No judges yet">Create a judge invite link above.</EmptyState>
        )}
      </Panel>
    </div>
  );
}
