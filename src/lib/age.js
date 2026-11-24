// Whole years between dateOfBirth and onDate (UTC calendar dates).
export function ageOn(dateOfBirth, onDate = new Date()) {
  const dob = new Date(dateOfBirth);
  const on = new Date(onDate);
  let age = on.getUTCFullYear() - dob.getUTCFullYear();
  const beforeBirthday =
    on.getUTCMonth() < dob.getUTCMonth() ||
    (on.getUTCMonth() === dob.getUTCMonth() && on.getUTCDate() < dob.getUTCDate());
  if (beforeBirthday) age -= 1;
  return age;
}

export function eligibilityDate(pageant) {
  return pageant.eventDate ?? new Date();
}

// Parse a yyyy-mm-dd string from <input type="date"> as a UTC date. Returns null if invalid.
export function parseDateInput(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const d = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function toDateInput(date) {
  return date ? new Date(date).toISOString().slice(0, 10) : "";
}

export function formatDate(date) {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-US", {
    timeZone: "UTC",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
