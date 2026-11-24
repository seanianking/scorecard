import { db } from "@/lib/db";
import { requireDirector } from "@/lib/access";
import { rowControls } from "@/lib/controls";
import { addQuestion, deleteQuestion, updateQuestion } from "@/app/actions/setup";
import { AddQuestion, QuestionRow } from "@/components/manage/SetupEditors";
import { EmptyState, Panel } from "@/components/ui";

export const metadata = { title: "Bio questions" };

export default async function QuestionsPage({ params }) {
  const { id } = await params;
  await requireDirector(id);
  const questions = await db.question.findMany({
    where: { pageantId: id },
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
  });

  return (
    <div className="grid gap-6">
      <Panel
        title="Bio questions"
        description="Contestants answer these when they register. Judges can read the answers while scoring. Name, date of birth and age group are always collected."
      >
        {questions.length ? (
          <div className="divide-y divide-stone-100">
            {questions.map((q, i) => (
              <QuestionRow
                key={q.id}
                question={q}
                update={updateQuestion.bind(null, id, q.id)}
                controls={rowControls(id, "question", questions, i, deleteQuestion, "Delete this question and every contestant's answer to it?")}
              />
            ))}
          </div>
        ) : (
          <EmptyState title="No questions yet">Add questions like hometown, platform, talent or a short bio.</EmptyState>
        )}
      </Panel>
      <Panel title="Add a question">
        <AddQuestion action={addQuestion.bind(null, id)} />
      </Panel>
    </div>
  );
}
