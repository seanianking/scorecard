"use client";

import { useRef, useState } from "react";
import { ActionForm, SubmitButton } from "@/components/forms";
import { Select, Textarea } from "@/components/ui";
import { appendComment, FEEDBACK_MAX_LENGTH, hasComment } from "@/lib/quick-comments";

export default function ScoreSheet({
  action,
  criteria,
  initialScores,
  initialFeedback,
  quickComments = [],
  nextContestantId,
  locked,
}) {
  const [values, setValues] = useState(initialScores);
  const [feedback, setFeedback] = useState(initialFeedback);
  const [quickError, setQuickError] = useState(null);
  const feedbackRef = useRef(null);

  function onQuickAdd(e) {
    const text = e.target.value;
    e.target.value = ""; // reset so the next pick (even the same one) triggers again
    if (!text) return;
    const next = appendComment(feedback, text);
    if (next === null) {
      setQuickError(`That would make your feedback longer than ${FEEDBACK_MAX_LENGTH} characters.`);
      return;
    }
    setQuickError(null);
    setFeedback(next);
    // Keep the end of the comment in view so the judge sees what was added.
    requestAnimationFrame(() => {
      const el = feedbackRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    });
  }

  const total = criteria.reduce((sum, c) => {
    const v = Number(values[c.id]);
    return values[c.id] !== "" && Number.isFinite(v) ? sum + v * c.weight : sum;
  }, 0);
  const possible = criteria.reduce((sum, c) => sum + c.maxScore * c.weight, 0);

  return (
    <ActionForm action={action} className="grid gap-5" showSuccess>
      <input type="hidden" name="nextContestantId" value={nextContestantId ?? ""} />
      <fieldset disabled={locked} className="grid gap-4">
        {criteria.map((c) => (
          <div key={c.id} className="grid gap-2 rounded-lg border border-stone-200 p-4 sm:grid-cols-[1fr_auto] sm:items-center">
            <label htmlFor={`c_${c.id}`}>
              <span className="font-medium text-stone-900">{c.name}</span>
              <span className="ml-2 text-xs text-stone-500">
                out of {c.maxScore}
                {c.weight !== 1 && ` · weight ×${c.weight}`}
              </span>
              {c.description && <span className="mt-0.5 block text-sm text-stone-500">{c.description}</span>}
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={0}
                max={c.maxScore}
                step={0.5}
                value={values[c.id] === "" ? 0 : values[c.id]}
                onChange={(e) => setValues((v) => ({ ...v, [c.id]: e.target.value }))}
                className="w-40 accent-plum-700"
                aria-hidden
                tabIndex={-1}
              />
              <input
                id={`c_${c.id}`}
                name={`c_${c.id}`}
                type="number"
                inputMode="decimal"
                min={0}
                max={c.maxScore}
                step="any"
                value={values[c.id]}
                onChange={(e) => setValues((v) => ({ ...v, [c.id]: e.target.value }))}
                placeholder="—"
                className="w-20 rounded-md border border-stone-300 px-2 py-1.5 text-right text-lg tabular-nums focus:border-plum-500 focus:outline-none focus:ring-2 focus:ring-plum-200"
              />
            </div>
          </div>
        ))}

        <div className="grid gap-2">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <label htmlFor="feedback" className="text-sm font-medium text-stone-700">
              Feedback for the contestant
            </label>
            {quickComments.length > 0 && (
              <Select
                aria-label="Quick add a comment"
                defaultValue=""
                onChange={onQuickAdd}
                className="!w-auto max-w-full sm:min-w-64"
              >
                <option value="">+ Quick add a comment…</option>
                {quickComments.map((c) => (
                  <option key={c.id} value={c.text}>
                    {hasComment(feedback, c.text) ? "✓ " : ""}
                    {c.text}
                  </option>
                ))}
              </Select>
            )}
          </div>
          <Textarea
            id="feedback"
            ref={feedbackRef}
            name="feedback"
            rows={5}
            maxLength={FEEDBACK_MAX_LENGTH}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Pick quick comments above or write your own. Contestants see this (without your name) when results are published."
          />
          <div className="flex justify-between gap-3 text-xs">
            <span role="alert" className="text-red-700">
              {quickError}
            </span>
            <span className="text-stone-400 tabular-nums">
              {feedback.length} / {FEEDBACK_MAX_LENGTH}
            </span>
          </div>
        </div>
      </fieldset>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-stone-100 pt-4">
        <p className="text-sm text-stone-600">
          Weighted total: <span className="font-semibold tabular-nums text-stone-900">{Math.round(total * 100) / 100}</span> /{" "}
          {Math.round(possible * 100) / 100}
        </p>
        {!locked && (
          <div className="flex flex-wrap gap-2">
            <SubmitButton variant="secondary" name="intent" value="back">
              Save & back to list
            </SubmitButton>
            <SubmitButton variant="secondary" name="intent" value="stay">
              Save
            </SubmitButton>
            {nextContestantId && (
              <SubmitButton name="intent" value="next">
                Save & next contestant →
              </SubmitButton>
            )}
          </div>
        )}
      </div>
    </ActionForm>
  );
}
