import { test } from "node:test";
import assert from "node:assert/strict";
import { computeResults } from "../src/lib/scoring.js";
import { ageOn, parseDateInput } from "../src/lib/age.js";

const events = [
  {
    id: "e1",
    name: "Interview",
    criteria: [
      { id: "c1", name: "Poise", maxScore: 10, weight: 1 },
      { id: "c2", name: "Communication", maxScore: 10, weight: 2 },
    ],
  },
  { id: "e2", name: "Talent", criteria: [{ id: "c3", name: "Skill", maxScore: 20, weight: 1 }] },
];

const contestants = [
  { id: "a", ageGroupId: "g1" },
  { id: "b", ageGroupId: "g1" },
  { id: "c", ageGroupId: "g2" },
];

test("averages judges, applies weights and ranks within age group", () => {
  const scores = [
    // contestant a: two judges
    { judgeId: "j1", contestantId: "a", criterionId: "c1", value: 8 },
    { judgeId: "j2", contestantId: "a", criterionId: "c1", value: 6 }, // avg 7 → 7
    { judgeId: "j1", contestantId: "a", criterionId: "c2", value: 9 },
    { judgeId: "j2", contestantId: "a", criterionId: "c2", value: 9 }, // avg 9 ×2 → 18
    { judgeId: "j1", contestantId: "a", criterionId: "c3", value: 15 },
    { judgeId: "j2", contestantId: "a", criterionId: "c3", value: 17 }, // avg 16 → 16
    // contestant b: only one criterion scored
    { judgeId: "j1", contestantId: "b", criterionId: "c3", value: 20 },
  ];
  const { rows, groups } = computeResults({ events, contestants, scores, judgeCount: 2 });
  const a = rows.find((r) => r.contestant.id === "a");
  const b = rows.find((r) => r.contestant.id === "b");
  const c = rows.find((r) => r.contestant.id === "c");

  assert.equal(a.totalPoints, 41);
  assert.equal(a.totalPossible, 50); // 10 + 20 + 20
  assert.equal(a.percent, 82);
  assert.equal(a.events[0].points, 25);
  assert.equal(a.completeness, 1);

  assert.equal(b.totalPoints, 20);
  assert.equal(b.completeness, 1 / 6);
  assert.equal(b.events[0].criteria[0].average, null);

  assert.equal(a.rank, 1);
  assert.equal(b.rank, 2);
  assert.equal(c.rank, 1); // separate age group
  assert.equal(groups.get("g1").length, 2);
});

test("ties share a rank", () => {
  const scores = [
    { judgeId: "j1", contestantId: "a", criterionId: "c1", value: 5 },
    { judgeId: "j1", contestantId: "b", criterionId: "c1", value: 5 },
  ];
  const { rows } = computeResults({ events, contestants: contestants.slice(0, 2), scores, judgeCount: 1 });
  assert.deepEqual(rows.map((r) => r.rank), [1, 1]);
});

test("handles no criteria and no judges without dividing by zero", () => {
  const { rows } = computeResults({ events: [], contestants, scores: [], judgeCount: 0 });
  assert.equal(rows[0].percent, 0);
  assert.equal(rows[0].completeness, 0);
});

test("ageOn counts birthdays correctly", () => {
  const dob = parseDateInput("2010-06-15");
  assert.equal(ageOn(dob, parseDateInput("2026-06-14")), 15);
  assert.equal(ageOn(dob, parseDateInput("2026-06-15")), 16);
  assert.equal(ageOn(parseDateInput("2008-02-29"), parseDateInput("2026-02-28")), 17);
  assert.equal(ageOn(parseDateInput("2008-02-29"), parseDateInput("2026-03-01")), 18);
});

test("parseDateInput rejects junk", () => {
  assert.equal(parseDateInput("2026-13-45"), null);
  assert.equal(parseDateInput("not a date"), null);
  assert.equal(parseDateInput(undefined), null);
});

import { appendComment, DEFAULT_QUICK_COMMENTS, hasComment } from "../src/lib/quick-comments.js";

test("quick comments: 8 unique defaults", () => {
  assert.equal(DEFAULT_QUICK_COMMENTS.length, 8);
  assert.equal(new Set(DEFAULT_QUICK_COMMENTS.map((c) => c.toLowerCase())).size, 8);
  assert.ok(DEFAULT_QUICK_COMMENTS.includes("Love the dress!"));
  assert.ok(DEFAULT_QUICK_COMMENTS.includes("Over time on walk."));
});

test("quick comments: first pick fills, later picks append on new lines, freeform kept", () => {
  let fb = appendComment("", "Love the dress!");
  assert.equal(fb, "Love the dress!");
  fb = appendComment(fb, "Over time on walk.");
  assert.equal(fb, "Love the dress!\nOver time on walk.");
  fb = appendComment("My own note.  \n\n", "Great stage presence.");
  assert.equal(fb, "My own note.\nGreat stage presence.");
  assert.equal(appendComment("x", "   "), "x");
});

test("quick comments: refuses to exceed the feedback limit", () => {
  assert.equal(appendComment("a".repeat(3995), "Love the dress!", 4000), null);
});

test("quick comments: hasComment matches whole lines only", () => {
  assert.ok(hasComment("Mine\nLove the dress!", "Love the dress!"));
  assert.ok(!hasComment("I love the dress! so much", "Love the dress!"));
});
