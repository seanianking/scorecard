import { db } from "@/lib/db";
import { requireDirector } from "@/lib/access";
import { rowControls } from "@/lib/controls";
import { QUICK_COMMENT_LIMIT } from "@/lib/quick-comments";
import {
  addQuickComment,
  addSuggestedQuickComments,
  deleteQuickComment,
  updateQuickComment,
} from "@/app/actions/setup";
import { AddQuickComment, AddSuggestedQuickComments, QuickCommentRow } from "@/components/manage/SetupEditors";
import { EmptyState, Panel } from "@/components/ui";

export const metadata = { title: "Quick comments" };

export default async function QuickCommentsPage({ params }) {
  const { id } = await params;
  await requireDirector(id);
  const comments = await db.quickComment.findMany({
    where: { pageantId: id },
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
  });

  return (
    <div className="grid gap-6">
      <Panel
        title="Quick comments"
        description="Canned feedback judges can pick from a dropdown while scoring. Each pick is added to their comment on its own line, and they can still type their own feedback. Contestants see the comments when results are published."
        actions={<AddSuggestedQuickComments action={addSuggestedQuickComments.bind(null, id)} />}
      >
        {comments.length ? (
          <div className="divide-y divide-stone-100">
            {comments.map((c, i) => (
              <QuickCommentRow
                key={c.id}
                comment={c}
                update={updateQuickComment.bind(null, id, c.id)}
                controls={rowControls(id, "quickComment", comments, i, deleteQuickComment, `Delete “${c.text}”?`)}
              />
            ))}
          </div>
        ) : (
          <EmptyState title="No quick comments yet">
            Add your own below, or use “Add suggested comments” to start with eight common ones.
          </EmptyState>
        )}
      </Panel>
      <Panel title="Add a quick comment" description={`Up to ${QUICK_COMMENT_LIMIT} comments, 200 characters each.`}>
        <AddQuickComment action={addQuickComment.bind(null, id)} />
      </Panel>
    </div>
  );
}
