import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { formatDate } from "@/lib/age";
import { Badge, ButtonLink, EmptyState, PageHeader, Panel, StatusBadge } from "@/components/ui";

export const metadata = { title: "Dashboard" };

function PageantRow({ href, pageant, extra }) {
  return (
    <li>
      <Link
        href={href}
        className="flex flex-col gap-1 rounded-lg px-3 py-3 hover:bg-stone-50 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <p className="font-medium text-stone-900">{pageant.name}</p>
          <p className="text-sm text-stone-500">
            {[formatDate(pageant.eventDate), pageant.location].filter(Boolean).join(" · ") || "No date set"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {extra}
          <StatusBadge status={pageant.status} />
        </div>
      </Link>
    </li>
  );
}

export default async function Dashboard() {
  const user = await requireUser("/dashboard");
  const [directing, competing, judging] = await Promise.all([
    db.pageant.findMany({
      where: { directorId: user.id },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { contestants: true, judges: true } } },
    }),
    db.contestant.findMany({
      where: { userId: user.id },
      include: { pageant: true, ageGroup: true },
      orderBy: { createdAt: "desc" },
    }),
    db.judge.findMany({ where: { userId: user.id }, include: { pageant: true }, orderBy: { createdAt: "desc" } }),
  ]);

  return (
    <div>
      <PageHeader
        title={`Hello, ${user.name.split(" ")[0]}`}
        subtitle="Your pageants, by role."
        actions={<ButtonLink href="/manage/new">New pageant</ButtonLink>}
      />
      <div className="grid gap-6">
        <Panel title="Directing" description="Pageants you run.">
          {directing.length ? (
            <ul className="-mx-3 divide-y divide-stone-100">
              {directing.map((p) => (
                <PageantRow
                  key={p.id}
                  href={`/manage/${p.id}`}
                  pageant={p}
                  extra={
                    <span className="text-xs text-stone-500">
                      {p._count.contestants} contestants · {p._count.judges} judges
                    </span>
                  }
                />
              ))}
            </ul>
          ) : (
            <EmptyState title="You aren't directing any pageants yet.">
              <Link href="/manage/new" className="text-plum-700 hover:underline">
                Create your first pageant
              </Link>
            </EmptyState>
          )}
        </Panel>

        {competing.length > 0 && (
          <Panel title="Competing" description="Pageants you've been invited to compete in.">
            <ul className="-mx-3 divide-y divide-stone-100">
              {competing.map((c) => (
                <PageantRow
                  key={c.id}
                  href={`/compete/${c.pageantId}`}
                  pageant={c.pageant}
                  extra={
                    c.registeredAt ? (
                      c.ageGroup && <Badge>{c.ageGroup.name}</Badge>
                    ) : (
                      <Badge tone="amber">Registration incomplete</Badge>
                    )
                  }
                />
              ))}
            </ul>
          </Panel>
        )}

        {judging.length > 0 && (
          <Panel title="Judging" description="Pageants you've been invited to judge.">
            <ul className="-mx-3 divide-y divide-stone-100">
              {judging.map((j) => (
                <PageantRow key={j.id} href={`/judge/${j.pageantId}`} pageant={j.pageant} />
              ))}
            </ul>
          </Panel>
        )}
      </div>
    </div>
  );
}
