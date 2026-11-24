import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireContestant } from "@/lib/access";
import { eligibilityDate, toDateInput } from "@/lib/age";
import { photoUrl } from "@/lib/photos";
import { saveRegistration } from "@/app/actions/registration";
import { removeMyPhoto, uploadMyPhoto } from "@/app/actions/photos";
import PhotoUploader from "@/components/PhotoUploader";
import RegistrationForm from "@/components/compete/RegistrationForm";
import { Panel } from "@/components/ui";

export const metadata = { title: "Registration" };

export default async function RegisterPage({ params }) {
  const { id } = await params;
  const { contestant, pageant } = await requireContestant(id);
  if (pageant.status !== "REGISTRATION") redirect(`/compete/${id}`);

  const [ageGroups, questions, answers] = await Promise.all([
    db.ageGroup.findMany({ where: { pageantId: id }, orderBy: [{ sortOrder: "asc" }, { id: "asc" }] }),
    db.question.findMany({ where: { pageantId: id }, orderBy: [{ sortOrder: "asc" }, { id: "asc" }] }),
    db.answer.findMany({ where: { contestantId: contestant.id } }),
  ]);
  const answerMap = new Map(answers.map((a) => [a.questionId, a.value]));

  return (
    <div className="grid gap-6">
      <Panel
        title={`Your photo${pageant.requirePhoto ? "" : " (optional)"}`}
        description="Judges use this to make sure they're scoring the right person on stage and in interviews."
      >
        <PhotoUploader
          uploadAction={uploadMyPhoto.bind(null, id)}
          removeAction={removeMyPhoto.bind(null, id)}
          url={photoUrl(contestant)}
          name={contestant.displayName}
          hint="Use a recent, well-lit photo showing your face clearly, like a headshot. JPEG, PNG or WebP, up to 10 MB."
        />
      </Panel>
      <Panel
        title={contestant.registeredAt ? "Edit your registration" : "Complete your registration"}
        description="You can come back and edit this until registration closes."
      >
        <RegistrationForm
          action={saveRegistration.bind(null, id)}
          contestant={{
            displayName: contestant.displayName,
            dateOfBirthInput: toDateInput(contestant.dateOfBirth),
            ageGroupId: contestant.ageGroupId,
            registeredAt: contestant.registeredAt,
          }}
          ageGroups={ageGroups.map(({ id, name, minAge, maxAge }) => ({ id, name, minAge, maxAge }))}
          questions={questions.map((q) => ({
            id: q.id,
            prompt: q.prompt,
            type: q.type,
            required: q.required,
            answer: answerMap.get(q.id) ?? "",
          }))}
          asOf={eligibilityDate(pageant).toISOString()}
          photoMissing={pageant.requirePhoto && !contestant.photoKey}
        />
      </Panel>
    </div>
  );
}
