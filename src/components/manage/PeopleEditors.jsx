"use client";

import { useState } from "react";
import { ActionForm, SubmitButton } from "@/components/forms";
import { Checkbox, Field, Input, Select } from "@/components/ui";

export function CreateInvite({ action }) {
  const [role, setRole] = useState("CONTESTANT");
  return (
    <ActionForm action={action} resetOnSuccess className="flex flex-wrap items-end gap-3">
      <Field label="Role" className="w-40">
        <Select name="role" value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="CONTESTANT">Contestant</option>
          <option value="JUDGE">Judge</option>
        </Select>
      </Field>
      <Field label="For (optional)" className="min-w-48 flex-1">
        <Input name="label" maxLength={200} placeholder="Name or email, to help you keep track" />
      </Field>
      <div className="pb-2">
        {role === "CONTESTANT" ? (
          <Checkbox name="singleUse" label="Single use" defaultChecked />
        ) : (
          <span className="text-xs text-stone-500">Judge links are always single use</span>
        )}
      </div>
      <SubmitButton>Create invite link</SubmitButton>
    </ActionForm>
  );
}

export function RevokeInvite({ action }) {
  return (
    <ActionForm action={action} confirm="Revoke this invite? The link will stop working.">
      <SubmitButton variant="ghost" className="!px-2 !py-1 text-xs text-red-700">
        Revoke
      </SubmitButton>
    </ActionForm>
  );
}

export function RemoveButton({ action, confirm, label = "Remove" }) {
  return (
    <ActionForm action={action} confirm={confirm}>
      <SubmitButton variant="danger" className="!px-2.5 !py-1 text-xs">
        {label}
      </SubmitButton>
    </ActionForm>
  );
}

export function ContestantAdminForm({ action, contestant, ageGroups }) {
  return (
    <ActionForm action={action} className="flex flex-wrap items-end gap-3" showSuccess>
      <Field label="Contestant #" className="w-32">
        <Input name="contestantNumber" type="number" min={1} max={9999} defaultValue={contestant.contestantNumber ?? ""} />
      </Field>
      <Field label="Age group" className="min-w-48 flex-1">
        <Select name="ageGroupId" defaultValue={contestant.ageGroupId ?? ""}>
          <option value="">Unassigned</option>
          {ageGroups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name} ({g.minAge}–{g.maxAge})
            </option>
          ))}
        </Select>
      </Field>
      <SubmitButton variant="secondary">Save</SubmitButton>
    </ActionForm>
  );
}
