"use client";

import { createContext, useActionState, useContext, useEffect, useRef, useState, useTransition } from "react";

const PendingContext = createContext(false);

/**
 * Wraps a server action of the form `(prevState, formData) => { error?, ok?, message? }`.
 * Submits via a transition (instead of the `action` prop) so React doesn't reset the
 * inputs when validation fails.
 */
export function ActionForm({
  action,
  children,
  className = "",
  confirm,
  resetOnSuccess = false,
  showSuccess = false,
  resetKey, // when this changes, any message from the last submission is hidden
}) {
  const [state, formAction, isPending] = useActionState(action, null);
  const [hidden, setHidden] = useState(null);
  useEffect(() => {
    setHidden(state);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only react to resetKey changes
  }, [resetKey]);
  const visible = state && state !== hidden ? state : null;
  const [, startTransition] = useTransition();
  const formRef = useRef(null);

  useEffect(() => {
    if (state?.ok && resetOnSuccess) formRef.current?.reset();
  }, [state, resetOnSuccess]);

  function onSubmit(e) {
    e.preventDefault();
    if (confirm && !window.confirm(confirm)) return;
    const formData = new FormData(e.currentTarget, e.nativeEvent.submitter);
    startTransition(() => formAction(formData));
  }

  return (
    <PendingContext.Provider value={isPending}>
      <form ref={formRef} onSubmit={onSubmit} className={className}>
        {children}
        {visible?.error && (
          <p role="alert" className="basis-full text-sm text-red-700 mt-2">
            {visible.error}
          </p>
        )}
        {showSuccess && visible?.ok && !isPending && (
          <p role="status" className="basis-full text-sm text-emerald-700 mt-2">
            {visible.message ?? "Saved."}
          </p>
        )}
      </form>
    </PendingContext.Provider>
  );
}

const VARIANTS = {
  primary: "bg-plum-700 text-white hover:bg-plum-800 disabled:bg-plum-400",
  secondary: "bg-white text-stone-800 border border-stone-300 hover:bg-stone-50 disabled:text-stone-400",
  danger: "bg-white text-red-700 border border-red-200 hover:bg-red-50 disabled:text-red-300",
  ghost: "text-stone-600 hover:text-stone-900 hover:bg-stone-100 disabled:opacity-30 disabled:hover:bg-transparent",
};

export function SubmitButton({ children, variant = "primary", className = "", name, value, pendingText, disabled = false }) {
  const pending = useContext(PendingContext);
  return (
    <button
      type="submit"
      name={name}
      value={value}
      disabled={pending || disabled}
      className={`inline-flex items-center justify-center rounded-md px-3.5 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed ${VARIANTS[variant]} ${className}`}
    >
      {pending && pendingText ? pendingText : children}
    </button>
  );
}

export function CopyButton({ text, label = "Copy link" }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        const url = text.startsWith("/") ? `${window.location.origin}${text}` : text;
        try {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          window.prompt("Copy this link:", url);
        }
      }}
      className="inline-flex items-center rounded-md border border-stone-300 bg-white px-2.5 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50"
    >
      {copied ? "Copied!" : label}
    </button>
  );
}
