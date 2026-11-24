"use client";

import { ActionForm, SubmitButton } from "@/components/forms";

export default function AcceptInvite({ action, label }) {
  return (
    <ActionForm action={action}>
      <SubmitButton pendingText="Joining…" className="w-full">
        {label}
      </SubmitButton>
    </ActionForm>
  );
}
