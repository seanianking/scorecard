"use client";

import { ActionForm, SubmitButton } from "@/components/forms";

const STEPS = [
  { key: "SETUP", label: "Setup" },
  { key: "REGISTRATION", label: "Registration" },
  { key: "JUDGING", label: "Judging" },
  { key: "COMPLETE", label: "Complete" },
];

const FORWARD_CONFIRM = {
  REGISTRATION: "Open registration? Invited contestants will be able to sign up.",
  JUDGING: "Start judging? Contestants will no longer be able to edit their registration.",
  COMPLETE: "Mark complete? Judges will no longer be able to change scores.",
};

export function StatusControl({ status, action }) {
  const index = STEPS.findIndex((s) => s.key === status);
  const next = STEPS[index + 1];
  const prev = STEPS[index - 1];

  return (
    <div>
      <ol className="mb-5 grid grid-cols-4 gap-2">
        {STEPS.map((s, i) => (
          <li key={s.key} className="flex flex-col gap-1.5">
            <span className={`h-1.5 rounded-full ${i <= index ? "bg-plum-600" : "bg-stone-200"}`} />
            <span className={`text-xs font-medium ${i === index ? "text-plum-800" : "text-stone-500"}`}>{s.label}</span>
          </li>
        ))}
      </ol>
      <div className="flex flex-wrap gap-2">
        {next && (
          <ActionForm action={action} confirm={FORWARD_CONFIRM[next.key]}>
            <input type="hidden" name="status" value={next.key} />
            <SubmitButton pendingText="Updating…">
              {next.key === "REGISTRATION" ? "Open registration" : next.key === "JUDGING" ? "Start judging" : "Mark complete"}
            </SubmitButton>
          </ActionForm>
        )}
        {prev && (
          <ActionForm action={action} confirm={`Move back to ${prev.label}?`}>
            <input type="hidden" name="status" value={prev.key} />
            <SubmitButton variant="secondary">Back to {prev.label.toLowerCase()}</SubmitButton>
          </ActionForm>
        )}
      </div>
    </div>
  );
}

export function PublishControl({ published, action }) {
  return (
    <ActionForm
      action={action}
      confirm={published ? "Hide results from contestants?" : "Publish results? Contestants will see their placement, scores and judges' feedback."}
    >
      <input type="hidden" name="publish" value={published ? "false" : "true"} />
      <SubmitButton variant={published ? "secondary" : "primary"}>
        {published ? "Unpublish results" : "Publish results to contestants"}
      </SubmitButton>
    </ActionForm>
  );
}

export function DeletePageant({ action, name }) {
  return (
    <ActionForm action={action} confirm={`Permanently delete “${name}” and all its registrations, scores and feedback? This can't be undone.`}>
      <SubmitButton variant="danger">Delete pageant</SubmitButton>
    </ActionForm>
  );
}
