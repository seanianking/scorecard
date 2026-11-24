"use client";

import { useState } from "react";
import { ActionForm, SubmitButton } from "@/components/forms";
import { Field, Input, Select, Textarea } from "@/components/ui";
import { ageOn, formatDate, parseDateInput } from "@/lib/age";

export default function RegistrationForm({ action, contestant, ageGroups, questions, asOf, photoMissing }) {
  const [dob, setDob] = useState(contestant.dateOfBirthInput);
  const [groupId, setGroupId] = useState(contestant.ageGroupId ?? "");

  const dobDate = parseDateInput(dob);
  const age = dobDate ? ageOn(dobDate, asOf) : null;
  const eligible = age === null ? ageGroups : ageGroups.filter((g) => age >= g.minAge && age <= g.maxAge);
  const selectedStillEligible = eligible.some((g) => g.id === groupId);

  return (
    <ActionForm action={action} className="grid gap-6" resetKey={photoMissing}>
      <section className="grid gap-4 sm:grid-cols-2">
        <Field label="Name as it should appear" className="sm:col-span-2">
          <Input name="displayName" required maxLength={100} defaultValue={contestant.displayName} />
        </Field>
        <Field label="Date of birth" hint={age !== null ? `You'll be ${age} on ${formatDate(asOf)}.` : undefined}>
          <Input type="date" name="dateOfBirth" required value={dob} onChange={(e) => setDob(e.target.value)} />
        </Field>
        <Field
          label="Age group"
          hint={
            age !== null && eligible.length === 0
              ? "No age group fits your age. Contact the director."
              : age === null
                ? "Enter your date of birth to see which groups you qualify for."
                : undefined
          }
        >
          <Select
            name="ageGroupId"
            required
            value={selectedStillEligible ? groupId : ""}
            onChange={(e) => setGroupId(e.target.value)}
          >
            <option value="" disabled>
              Choose…
            </option>
            {eligible.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name} (ages {g.minAge}–{g.maxAge})
              </option>
            ))}
          </Select>
        </Field>
      </section>

      {questions.length > 0 && (
        <section className="grid gap-4 border-t border-stone-100 pt-6">
          <h2 className="font-semibold text-stone-900">About you</h2>
          {questions.map((q) => (
            <Field key={q.id} label={`${q.prompt}${q.required ? "" : " (optional)"}`}>
              {q.type === "LONG_TEXT" ? (
                <Textarea name={`q_${q.id}`} required={q.required} maxLength={5000} rows={5} defaultValue={q.answer} />
              ) : (
                <Input name={`q_${q.id}`} required={q.required} maxLength={300} defaultValue={q.answer} />
              )}
            </Field>
          ))}
        </section>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton pendingText="Saving…">{contestant.registeredAt ? "Save changes" : "Submit registration"}</SubmitButton>
        {photoMissing && <span className="text-sm text-amber-700">Upload your photo above before submitting.</span>}
      </div>
    </ActionForm>
  );
}
