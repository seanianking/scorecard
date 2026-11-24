import { db } from "@/lib/db";
import { requireDirector } from "@/lib/access";
import { rowControls } from "@/lib/controls";
import {
  addCriterion,
  addEvent,
  deleteCriterion,
  deleteEvent,
  updateCriterion,
  updateEvent,
} from "@/app/actions/setup";
import {
  AddCriterion,
  AddEvent,
  CriterionRow,
  EventDetailsForm,
  ItemControls,
} from "@/components/manage/SetupEditors";
import { EmptyState, Panel } from "@/components/ui";

export const metadata = { title: "Events & criteria" };

export default async function EventsPage({ params }) {
  const { id } = await params;
  await requireDirector(id);
  const events = await db.event.findMany({
    where: { pageantId: id },
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    include: { criteria: { orderBy: [{ sortOrder: "asc" }, { id: "asc" }] } },
  });

  const totalPossible = events
    .flatMap((e) => e.criteria)
    .reduce((sum, c) => sum + c.maxScore * c.weight, 0);

  return (
    <div className="grid gap-6">
      <p className="text-sm text-stone-600">
        Each event is a segment of the competition, like Interview, Talent or Evening Gown. Judges score every
        criterion from 0 to its max score. A criterion is worth <em>max score × weight</em> points, and contestants are
        ranked within their age group by total points
        {totalPossible > 0 && <> (currently {Math.round(totalPossible * 100) / 100} possible)</>}.
      </p>

      {events.length === 0 && <EmptyState title="No events yet">Add your first event below.</EmptyState>}

      {events.map((event, i) => {
        const eventPossible = event.criteria.reduce((s, c) => s + c.maxScore * c.weight, 0);
        return (
          <Panel
            key={event.id}
            title={`${i + 1}. ${event.name}`}
            description={
              totalPossible > 0
                ? `${Math.round(eventPossible * 100) / 100} points · ${Math.round((eventPossible / totalPossible) * 1000) / 10}% of the total`
                : undefined
            }
            actions={
              <ItemControls
                {...rowControls(
                  id,
                  "event",
                  events,
                  i,
                  deleteEvent,
                  `Delete ${event.name}, its criteria, and all scores and feedback for it?`,
                )}
              />
            }
          >
            <div className="grid gap-6">
              <EventDetailsForm event={event} update={updateEvent.bind(null, id, event.id)} />
              <div>
                <h3 className="text-sm font-semibold text-stone-800">Judging criteria</h3>
                {event.criteria.length ? (
                  <div className="divide-y divide-stone-100">
                    {event.criteria.map((c, ci) => (
                      <CriterionRow
                        key={c.id}
                        criterion={c}
                        update={updateCriterion.bind(null, id, c.id)}
                        controls={rowControls(
                          id,
                          "criterion",
                          event.criteria,
                          ci,
                          deleteCriterion,
                          `Delete “${c.name}” and every score given for it?`,
                        )}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="py-3 text-sm text-stone-500">No criteria yet. Judges can't score this event until you add some.</p>
                )}
                <div className="mt-3 rounded-lg bg-stone-50 p-4">
                  <AddCriterion action={addCriterion.bind(null, id, event.id)} />
                </div>
              </div>
            </div>
          </Panel>
        );
      })}

      <Panel title="Add an event">
        <AddEvent action={addEvent.bind(null, id)} />
      </Panel>
    </div>
  );
}
