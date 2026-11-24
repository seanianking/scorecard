import { requireDirector } from "@/lib/access";
import { formatDate } from "@/lib/age";
import Tabs from "@/components/manage/Tabs";
import { StatusBadge } from "@/components/ui";

export default async function ManageLayout({ children, params }) {
  const { id } = await params;
  const { pageant } = await requireDirector(id);
  const base = `/manage/${id}`;

  return (
    <div>
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-plum-700">Directing</p>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-3xl text-stone-900">{pageant.name}</h1>
          <StatusBadge status={pageant.status} />
        </div>
        <p className="mt-1 text-sm text-stone-500">
          {[formatDate(pageant.eventDate), pageant.location].filter(Boolean).join(" · ") || "No date or location set"}
        </p>
      </div>
      <Tabs
        tabs={[
          { href: base, label: "Overview", exact: true },
          { href: `${base}/age-groups`, label: "Age groups" },
          { href: `${base}/questions`, label: "Bio questions" },
          { href: `${base}/events`, label: "Events & criteria" },
          { href: `${base}/comments`, label: "Quick comments" },
          { href: `${base}/people`, label: "Contestants & judges" },
          { href: `${base}/results`, label: "Results" },
        ]}
      />
      {children}
    </div>
  );
}
