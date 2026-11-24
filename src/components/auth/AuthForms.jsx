"use client";

import { ActionForm, SubmitButton } from "@/components/forms";
import { Field, Input } from "@/components/ui";
import { login, register } from "@/app/actions/auth";

export function LoginForm({ next }) {
  return (
    <ActionForm action={login} className="flex flex-col gap-4">
      <input type="hidden" name="next" value={next ?? ""} />
      <Field label="Email">
        <Input type="email" name="email" autoComplete="email" required />
      </Field>
      <Field label="Password">
        <Input type="password" name="password" autoComplete="current-password" required />
      </Field>
      <SubmitButton pendingText="Signing in…">Sign in</SubmitButton>
    </ActionForm>
  );
}

export function RegisterForm({ next }) {
  return (
    <ActionForm action={register} className="flex flex-col gap-4">
      <input type="hidden" name="next" value={next ?? ""} />
      <Field label="Full name">
        <Input name="name" autoComplete="name" required maxLength={100} />
      </Field>
      <Field label="Email">
        <Input type="email" name="email" autoComplete="email" required />
      </Field>
      <Field label="Password" hint="At least 8 characters.">
        <Input type="password" name="password" autoComplete="new-password" required minLength={8} />
      </Field>
      <SubmitButton pendingText="Creating account…">Create account</SubmitButton>
    </ActionForm>
  );
}
