// Demo data for local development. Refuses to run in production.
// Usage: npm run db:seed   (all demo accounts use the password "password123")
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { DEFAULT_QUICK_COMMENTS } from "../src/lib/quick-comments.js";

if (process.env.NODE_ENV === "production") {
  console.error("Refusing to seed demo data in production.");
  process.exit(1);
}

const db = new PrismaClient();
const PASSWORD = "password123";

async function user(email, name, passwordHash) {
  return db.user.upsert({ where: { email }, update: {}, create: { email, name, passwordHash } });
}

async function main() {
  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  const director = await user("director@example.com", "Dana Director", passwordHash);
  const judgeUsers = await Promise.all([
    user("judge1@example.com", "Jordan Judge", passwordHash),
    user("judge2@example.com", "Riley Reviewer", passwordHash),
  ]);
  const people = [
    ["ava@example.com", "Ava Martinez", "2014-03-02", "Junior"],
    ["mia@example.com", "Mia Chen", "2013-09-18", "Junior"],
    ["zoe@example.com", "Zoe Okafor", "2010-01-25", "Teen"],
    ["lily@example.com", "Lily Johnson", "2009-07-11", "Teen"],
    ["grace@example.com", "Grace Patel", "2004-05-30", "Miss"],
  ];
  const contestantUsers = await Promise.all(people.map(([e, n]) => user(e, n, passwordHash)));

  await db.pageant.deleteMany({ where: { directorId: director.id, name: "Miss Sunshine State 2027 (demo)" } });

  const pageant = await db.pageant.create({
    data: {
      name: "Miss Sunshine State 2027 (demo)",
      description: "Annual state pageant celebrating scholarship, service and talent.",
      location: "Orlando, FL",
      eventDate: new Date("2027-04-17T00:00:00Z"),
      status: "JUDGING",
      directorId: director.id,
      quickComments: { create: DEFAULT_QUICK_COMMENTS.map((text, sortOrder) => ({ text, sortOrder })) },
      ageGroups: {
        create: [
          { name: "Junior", minAge: 10, maxAge: 13, sortOrder: 0 },
          { name: "Teen", minAge: 14, maxAge: 18, sortOrder: 1 },
          { name: "Miss", minAge: 19, maxAge: 28, sortOrder: 2 },
        ],
      },
      questions: {
        create: [
          { prompt: "Hometown", type: "SHORT_TEXT", sortOrder: 0 },
          { prompt: "What is your community service platform?", type: "LONG_TEXT", sortOrder: 1 },
          { prompt: "Talent", type: "SHORT_TEXT", sortOrder: 2 },
          { prompt: "A fun fact about you", type: "SHORT_TEXT", required: false, sortOrder: 3 },
        ],
      },
      events: {
        create: [
          {
            name: "Private Interview",
            description: "Ten-minute panel interview.",
            sortOrder: 0,
            criteria: {
              create: [
                { name: "Communication", description: "Clarity, confidence, listening", maxScore: 10, weight: 2, sortOrder: 0 },
                { name: "Poise", maxScore: 10, weight: 1, sortOrder: 1 },
              ],
            },
          },
          {
            name: "Talent",
            sortOrder: 1,
            criteria: {
              create: [
                { name: "Technical skill", maxScore: 10, weight: 1.5, sortOrder: 0 },
                { name: "Stage presence", maxScore: 10, weight: 1, sortOrder: 1 },
              ],
            },
          },
          {
            name: "Evening Wear",
            sortOrder: 2,
            criteria: { create: [{ name: "Overall impression", maxScore: 10, weight: 1, sortOrder: 0 }] },
          },
        ],
      },
    },
    include: { ageGroups: true, questions: true, events: { include: { criteria: true } } },
  });

  const groupByName = Object.fromEntries(pageant.ageGroups.map((g) => [g.name, g.id]));
  const contestants = [];
  for (const [i, [, name, dob, group]] of people.entries()) {
    const c = await db.contestant.create({
      data: {
        pageantId: pageant.id,
        userId: contestantUsers[i].id,
        displayName: name,
        dateOfBirth: new Date(`${dob}T00:00:00Z`),
        ageGroupId: groupByName[group],
        contestantNumber: i + 1,
        registeredAt: new Date(),
        answers: {
          create: pageant.questions
            .filter((q) => q.required)
            .map((q) => ({
              questionId: q.id,
              value:
                q.prompt === "Hometown"
                  ? ["Tampa", "Gainesville", "Miami", "Tallahassee", "Jacksonville"][i]
                  : q.prompt === "Talent"
                    ? ["Piano", "Tap dance", "Vocal", "Baton twirling", "Spoken word"][i]
                    : "Promoting literacy through free reading programs at local libraries.",
            })),
        },
      },
    });
    contestants.push(c);
  }

  const judges = await Promise.all(
    judgeUsers.map((u) => db.judge.create({ data: { pageantId: pageant.id, userId: u.id } })),
  );

  // Judge 1 has scored the Interview for everyone; judge 2 is partway through.
  const interview = pageant.events.find((e) => e.name === "Private Interview");
  const rand = (seed) => Math.round((6 + ((seed * 9301 + 49297) % 233280) / 233280 * 4) * 2) / 2;
  let seed = 1;
  for (const [ji, judge] of judges.entries()) {
    for (const c of contestants.slice(0, ji === 0 ? contestants.length : 2)) {
      for (const crit of interview.criteria) {
        await db.score.create({
          data: { judgeId: judge.id, contestantId: c.id, criterionId: crit.id, value: rand(seed++) },
        });
      }
      await db.feedback.create({
        data: {
          judgeId: judge.id,
          contestantId: c.id,
          eventId: interview.id,
          comment: "Warm and articulate. Work on giving more specific examples.",
        },
      });
    }
  }

  await db.invite.create({
    data: { pageantId: pageant.id, role: "CONTESTANT", label: "Open registration link", singleUse: false, token: "demo-contestant-invite" },
  });

  console.log(`Seeded "${pageant.name}".`);
  console.log(`Sign in as director@example.com, judge1@example.com, or ava@example.com (password: ${PASSWORD}).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
