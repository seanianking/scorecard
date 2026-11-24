"use client";

import { ActionForm, SubmitButton } from "@/components/forms";
import { Checkbox, Field, Input, Textarea } from "@/components/ui";

export default function PageantForm({ action, pageant, submitLabel = "Save", showSuccess = false }) {
  return (
    <ActionForm action={action} className="grid gap-4 sm:grid-cols-2" showSuccess={showSuccess}>
      <Field label="Pageant name" className="sm:col-span-2">
        <Input name="name" required maxLength={120} defaultValue={pageant?.name} placeholder="e.g. Miss Sunshine State 2027" />
      </Field>
      <Field label="Event date" hint="Contestant ages are calculated as of this date.">
        <Input type="date" name="eventDate" defaultValue={pageant?.eventDateInput} />
      </Field>
      <Field label="Location">
        <Input name="location" maxLength={200} defaultValue={pageant?.location} placeholder="Venue, city" />
      </Field>
      <Field label="Description" className="sm:col-span-2" hint="Shown to invited contestants and judges.">
        <Textarea name="description" maxLength={2000} defaultValue={pageant?.description} />
      </Field>
      <div className="sm:col-span-2">
        <Checkbox
          name="requirePhoto"
          label="Require contestants to upload a photo before registering (helps judges identify them)"
          defaultChecked={pageant?.requirePhoto ?? true}
        />
      </div>
      <div className="sm:col-span-2">
        <SubmitButton pendingText="Saving…">{submitLabel}</SubmitButton>
      </div>
    </ActionForm>
  );
}
