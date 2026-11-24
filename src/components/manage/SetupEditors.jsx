"use client";

import { ActionForm, SubmitButton } from "@/components/forms";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui";

const QUESTION_TYPES = { SHORT_TEXT: "Short answer", LONG_TEXT: "Paragraph" };

export function ItemControls({ moveUp, moveDown, remove, confirmText, isFirst, isLast }) {
  return (
    <div className="flex items-center gap-1">
      {moveUp && (
        <ActionForm action={moveUp}>
          <SubmitButton variant="ghost" className="!px-2" disabled={isFirst}>
            <span aria-label="Move up">↑</span>
          </SubmitButton>
        </ActionForm>
      )}
      {moveDown && (
        <ActionForm action={moveDown}>
          <SubmitButton variant="ghost" className="!px-2" disabled={isLast}>
            <span aria-label="Move down">↓</span>
          </SubmitButton>
        </ActionForm>
      )}
      <ActionForm action={remove} confirm={confirmText}>
        <SubmitButton variant="ghost" className="!px-2 text-red-700 hover:!bg-red-50 hover:!text-red-800">
          Delete
        </SubmitButton>
      </ActionForm>
    </div>
  );
}

// ---------- Age groups ----------

function AgeGroupFields({ group }) {
  return (
    <>
      <Field label="Name" className="min-w-40 flex-1">
        <Input name="name" required maxLength={80} defaultValue={group?.name} placeholder="e.g. Teen" />
      </Field>
      <Field label="Min age" className="w-24">
        <Input name="minAge" type="number" min={0} max={120} required defaultValue={group?.minAge} />
      </Field>
      <Field label="Max age" className="w-24">
        <Input name="maxAge" type="number" min={0} max={120} required defaultValue={group?.maxAge} />
      </Field>
    </>
  );
}

export function AgeGroupRow({ group, update, controls }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 py-4">
      <ActionForm action={update} className="flex flex-1 flex-wrap items-end gap-3" showSuccess>
        <AgeGroupFields group={group} />
        <SubmitButton variant="secondary">Save</SubmitButton>
      </ActionForm>
      <ItemControls {...controls} />
    </div>
  );
}

export function AddAgeGroup({ action }) {
  return (
    <ActionForm action={action} resetOnSuccess className="flex flex-wrap items-end gap-3">
      <AgeGroupFields />
      <SubmitButton>Add age group</SubmitButton>
    </ActionForm>
  );
}

// ---------- Questions ----------

function QuestionFields({ question }) {
  return (
    <>
      <Field label="Question" className="sm:col-span-3">
        <Input name="prompt" required maxLength={500} defaultValue={question?.prompt} placeholder="e.g. What is your platform?" />
      </Field>
      <Field label="Answer type">
        <Select name="type" defaultValue={question?.type ?? "SHORT_TEXT"}>
          {Object.entries(QUESTION_TYPES).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </Select>
      </Field>
      <div className="flex items-end pb-2">
        <Checkbox name="required" label="Required" defaultChecked={question?.required ?? true} />
      </div>
    </>
  );
}

export function QuestionRow({ question, update, controls }) {
  return (
    <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-end">
      <ActionForm action={update} className="grid flex-1 items-end gap-3 sm:grid-cols-[1fr_1fr_1fr_12rem_auto_auto]" showSuccess>
        <QuestionFields question={question} />
        <SubmitButton variant="secondary">Save</SubmitButton>
      </ActionForm>
      <ItemControls {...controls} />
    </div>
  );
}

export function AddQuestion({ action }) {
  return (
    <ActionForm action={action} resetOnSuccess className="grid items-end gap-3 sm:grid-cols-[1fr_1fr_1fr_12rem_auto_auto]">
      <QuestionFields />
      <SubmitButton>Add question</SubmitButton>
    </ActionForm>
  );
}

// ---------- Events ----------

export function EventFields({ event }) {
  return (
    <>
      <Field label="Event name">
        <Input name="name" required maxLength={120} defaultValue={event?.name} placeholder="e.g. Private Interview" />
      </Field>
      <Field label="Description (shown to judges)">
        <Textarea name="description" rows={2} maxLength={1000} defaultValue={event?.description} />
      </Field>
    </>
  );
}

export function EventDetailsForm({ event, update }) {
  return (
    <ActionForm action={update} className="grid gap-3" showSuccess>
      <EventFields event={event} />
      <div>
        <SubmitButton variant="secondary">Save event</SubmitButton>
      </div>
    </ActionForm>
  );
}

export function AddEvent({ action }) {
  return (
    <ActionForm action={action} resetOnSuccess className="grid gap-3">
      <EventFields />
      <div>
        <SubmitButton>Add event</SubmitButton>
      </div>
    </ActionForm>
  );
}

// ---------- Criteria ----------

function CriterionFields({ criterion }) {
  return (
    <>
      <Field label="Criterion" className="min-w-40 flex-[2]">
        <Input name="name" required maxLength={120} defaultValue={criterion?.name} placeholder="e.g. Poise" />
      </Field>
      <Field label="Guidance for judges" className="min-w-40 flex-[3]">
        <Input name="description" maxLength={1000} defaultValue={criterion?.description} />
      </Field>
      <Field label="Max score" className="w-24">
        <Input name="maxScore" type="number" min={1} max={100} required defaultValue={criterion?.maxScore ?? 10} />
      </Field>
      <Field label="Weight" className="w-24">
        <Input name="weight" type="number" min={0.1} max={100} step={0.1} required defaultValue={criterion?.weight ?? 1} />
      </Field>
    </>
  );
}

export function CriterionRow({ criterion, update, controls }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 py-3">
      <ActionForm action={update} className="flex flex-1 flex-wrap items-end gap-3" showSuccess>
        <CriterionFields criterion={criterion} />
        <SubmitButton variant="secondary">Save</SubmitButton>
      </ActionForm>
      <ItemControls {...controls} />
    </div>
  );
}

export function AddCriterion({ action }) {
  return (
    <ActionForm action={action} resetOnSuccess className="flex flex-wrap items-end gap-3">
      <CriterionFields />
      <SubmitButton>Add criterion</SubmitButton>
    </ActionForm>
  );
}

// ---------- Quick comments ----------

export function QuickCommentRow({ comment, update, controls }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-3">
      <ActionForm action={update} className="flex flex-1 flex-wrap items-center gap-3" showSuccess>
        <Input name="text" required maxLength={200} defaultValue={comment.text} aria-label="Comment" className="min-w-48 flex-1" />
        <SubmitButton variant="secondary">Save</SubmitButton>
      </ActionForm>
      <ItemControls {...controls} />
    </div>
  );
}

export function AddQuickComment({ action }) {
  return (
    <ActionForm action={action} resetOnSuccess className="flex flex-wrap items-end gap-3">
      <Field label="Comment" className="min-w-48 flex-1">
        <Input name="text" required maxLength={200} placeholder="e.g. Great energy on stage!" />
      </Field>
      <SubmitButton>Add comment</SubmitButton>
    </ActionForm>
  );
}

export function AddSuggestedQuickComments({ action }) {
  return (
    <ActionForm action={action} showSuccess>
      <SubmitButton variant="secondary">Add suggested comments</SubmitButton>
    </ActionForm>
  );
}
