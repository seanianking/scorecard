import Link from "next/link";
import { requireDirector } from "@/lib/access";
import { loadResults } from "@/lib/results";
import { photoUrl } from "@/lib/photos";
import ContestantPhoto from "@/components/ContestantPhoto";
import { Badge, EmptyState, Notice, Panel } from "@/components/ui";

export const metadata = { title: "Results" };

function Completeness({ value }) {
  const pct = Math.round(value * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-stone-200">
        <div className={`h-full ${pct === 100 ? "bg-emerald-500" : "bg-amber-400"}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs tabular-nums text-stone-500">{pct}%</span>
    </div>
  );
}

export default async function ResultsPage({ params }) {
  const { id } = await params;
  const { pageant } = await requireDirector(id);
  const { events, ageGroups, groups, rows, judgeCount } = await loadResults(id);

  if (!rows.length) {
    return <EmptyState title="No registered contestants yet">Results appear here as judges enter scores.</EmptyState>;
  }

  const sections = [
    ...ageGroups.map((g) => ({ key: g.id, title: `${g.name} (ages ${g.minAge}–${g.maxAge})`, rows: groups.get(g.id) ?? [] })),
    ...(groups.has("none") ? [{ key: "none", title: "No age group", rows: groups.get("none") }] : []),
  ].filter((s) => s.rows.length);

  const incomplete = rows.some((r) => r.completeness < 1);

  return (
    <div className="grid gap-6">
      {pageant.status !== "COMPLETE" && (
        <Notice tone="amber">
          These results are provisional. Scoring is {pageant.status === "JUDGING" ? "still in progress" : "not open yet"}.
        </Notice>
      )}
      {pageant.status === "COMPLETE" && incomplete && (
        <Notice tone="amber">
          Some contestants are missing scores from {judgeCount === 1 ? "the judge" : "one or more judges"}. Missing
          scores count as zero.
        </Notice>
      )}
      {sections.map((section) => (
        <Panel key={section.key} title={section.title}>
          <div className="-mx-5 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-stone-500">
                <tr>
                  <th className="px-5 py-2 font-medium">Rank</th>
                  <th className="px-5 py-2 font-medium">Contestant</th>
                  {events.map((e) => (
                    <th key={e.id} className="px-3 py-2 font-medium">
                      {e.name}
                    </th>
                  ))}
                  <th className="px-3 py-2 font-medium">Total</th>
                  <th className="px-5 py-2 font-medium">Scored</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {section.rows.map((r) => (
                  <tr key={r.contestant.id} className="hover:bg-stone-50">
                    <td className="px-5 py-2.5">
                      {r.rank <= 3 ? (
                        <Badge tone={r.rank === 1 ? "plum" : "neutral"}>#{r.rank}</Badge>
                      ) : (
                        <span className="pl-2 text-stone-500">#{r.rank}</span>
                      )}
                    </td>
                    <td className="px-5 py-2.5">
                      <Link
                        href={`/manage/${id}/contestants/${r.contestant.id}`}
                        className="flex items-center gap-3 font-medium text-plum-800 hover:underline"
                      >
                        <ContestantPhoto url={photoUrl(r.contestant)} name={r.contestant.displayName} size="sm" />
                        <span>
                          {r.contestant.contestantNumber && (
                            <span className="mr-1.5 text-stone-400">{r.contestant.contestantNumber}</span>
                          )}
                          {r.contestant.displayName}
                        </span>
                      </Link>
                    </td>
                    {r.events.map((e) => (
                      <td key={e.eventId} className="px-3 py-2.5 tabular-nums">
                        {e.points}
                      </td>
                    ))}
                    <td className="px-3 py-2.5 font-semibold tabular-nums">
                      {r.totalPoints} <span className="text-xs font-normal text-stone-400">({r.percent}%)</span>
                    </td>
                    <td className="px-5 py-2.5">
                      <Completeness value={r.completeness} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      ))}
    </div>
  );
}
