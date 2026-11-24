import { requireJudge } from "@/lib/access";
import { formatDate } from "@/lib/age";

export default async function JudgeLayout({ children, params }) {
  const { id } = await params;
  const { pageant } = await requireJudge(id);
  return (
    <div>
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-plum-700">Judging</p>
        <h1 className="font-display text-3xl text-stone-900">{pageant.name}</h1>
        <p className="mt-1 text-sm text-stone-500">
          {[formatDate(pageant.eventDate), pageant.location].filter(Boolean).join(" · ")}
        </p>
      </div>
      {children}
    </div>
  );
}
