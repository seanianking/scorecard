// Shared by server (defaults, validation) and client (appending in the score sheet).

export const QUICK_COMMENT_MAX_LENGTH = 200;
export const QUICK_COMMENT_LIMIT = 50;
export const FEEDBACK_MAX_LENGTH = 4000;

// Starter set added to every new pageant. A mix of praise and coaching that works across events.
export const DEFAULT_QUICK_COMMENTS = [
  "Love the dress!",
  "Over time on walk.",
  "Great stage presence.",
  "Beautiful smile and eye contact with the judges.",
  "Work on posture: shoulders back, chin up.",
  "Slow down and hold your poses a little longer.",
  "Confident, thoughtful answers.",
  "Practice your pivots and turns.",
];

/**
 * Appends a quick comment to the judge's feedback on its own line.
 * Returns null if the result would exceed the feedback length limit.
 */
export function appendComment(current, addition, max = FEEDBACK_MAX_LENGTH) {
  const text = addition.trim();
  if (!text) return current;
  const base = current.replace(/\s+$/, "");
  const next = base ? `${base}\n${text}` : text;
  return next.length > max ? null : next;
}

export function hasComment(current, text) {
  return current.split("\n").some((line) => line.trim() === text.trim());
}
