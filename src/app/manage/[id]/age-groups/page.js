import { db } from "@/lib/db";
import { requireDirector } from "@/lib/access";
import { formatDate } from "@/lib/age";
import { rowControls } from "@/lib/controls";
import { addAgeGroup, deleteAgeGroup, updateAgeGroup } from "@/app/actions/setup";
import { AddAgeGroup, AgeGroupRow } from "@/components/manage/SetupEditors";
import { EmptyState, Panel } from "@/components/ui";

export const metadata = { title: "Age groups" };

export default async function AgeGroupsPage({ params }) {
  const { id } = await params;
  const { pageant } = await requireDirector(id);
  const groups = await db.ageGroup.findMany({
    where: { pageantId: id },
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    include: { _count: { select: { contestants: true } } },
  });

  return (
    <div className="grid gap-6">
      <Panel
        title="Age groups"
        description={`Contestants pick a group when they register. Eligibility is checked against their age on ${
          pageant.eventDate ? formatDate(pageant.eventDate) : "the day they register (set an event date on the Overview tab to fix this)"
        }. Ranges are inclusive.`}
      >
        {groups.length ? (
          <div className="divide-y divide-stone-100">
            {groups.map((g, i) => (
              <div key={g.id}>
                <AgeGroupRow
                  group={g}
                  update={updateAgeGroup.bind(null, id, g.id)}
                  controls={rowControls(id, "ageGroup", groups, i, deleteAgeGroup, `Delete the ${g.name} age group?`)}
                />
                {g._count.contestants > 0 && (
                  <p className="-mt-2 pb-3 text-xs text-stone-500">{g._count.contestants} contestant(s) in this group</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="No age groups yet">Add your first division below, e.g. “Junior Miss, 13–15”.</EmptyState>
        )}
      </Panel>
      <Panel title="Add an age group">
        <AddAgeGroup action={addAgeGroup.bind(null, id)} />
      </Panel>
    </div>
  );
}
