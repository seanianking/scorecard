# Scorecard

Pageant management for directors, contestants and judges.

- **Directors** create a pageant and define its age groups, bio questions, events and weighted judging criteria. They invite contestants and judges by link, move the pageant through its stages, and publish results.
- **Contestants** accept an invite, upload a photo, choose an age group they're eligible for (checked against their date of birth on the event date), and answer the bio questions. After results are published they see their placement, scores and anonymized judge feedback.
- **Judges** score each contestant event by event (0 to the criterion's max) and leave written feedback. They see the contestant's photo, number and bio while scoring, so they can confirm they have the right person on stage or in an interview.

## Getting started

```bash
npm install
cp .env.example .env
npm run db:migrate     # creates prisma/dev.db
npm run db:seed        # optional demo pageant
npm run dev
```

The seed creates a demo pageant that is mid-judging. Every demo account's password is `password123`:

| Role       | Email                  |
| ---------- | ---------------------- |
| Director   | `director@example.com` |
| Judge      | `judge1@example.com`, `judge2@example.com` |
| Contestant | `ava@example.com`, `zoe@example.com`, … |

## Pageant lifecycle

| Status           | What's allowed |
| ---------------- | -------------- |
| **Setup**        | Director configures everything. Judges can accept invites. |
| **Registration** | Contestants accept invites and register or edit their entry. Needs at least one age group. |
| **Judging**      | Registration is locked. Judges enter scores and feedback. Needs at least one criterion. |
| **Complete**     | Scores are locked. The director can publish results to contestants. |

## Contestant photos

- Contestants upload a photo during registration, and can replace it until registration closes. Directors can upload, replace or remove a photo at any time, for example with a picture taken at check-in.
- Each pageant has a **Require a photo** setting, on by default for new pageants. When it's on, registration can't be submitted without a photo.
- Uploads are limited to JPEG, PNG or WebP up to 10 MB. The real format is detected from the file contents, not the file name.
- Every upload is re-encoded to a JPEG of at most 800px. This **strips all metadata, including EXIF GPS location**, and fixes rotation.
- Files are stored in `UPLOAD_DIR` (default `./uploads/photos`, git-ignored), never under `public/`. They're served only through `/api/photos/[contestantId]`, which returns 404 to anyone other than the pageant's director, its judges, or the contestant.
- A photo file is deleted when it's replaced or removed, or when its contestant or pageant is deleted.

## Quick comments

Directors manage a list of canned comments on the **Quick comments** tab, such as "Love the dress!" or "Over time on walk." Every new pageant starts with 8 suggested defaults, which directors can edit, reorder, delete or add to. **Add suggested comments** restores any defaults that were removed. Limits: 50 comments per pageant, 200 characters each.

On the scoring sheet, judges pick from a **Quick add a comment** dropdown. The first pick fills the feedback box, and each later pick is appended on a new line. Comments already used are marked with ✓ but can be picked again. Judges can still type and edit freely. See [src/lib/quick-comments.js](src/lib/quick-comments.js).

## Scoring

For each criterion, the contestant's score is the **average across the judges who scored it**. A criterion is worth `average × weight` points out of `maxScore × weight`. Event and overall totals are sums. Contestants are ranked **within their age group** by total points, and ties share a rank. A criterion nobody has scored yet counts as 0, so the results page shows how complete each contestant's scoring is. See [src/lib/scoring.js](src/lib/scoring.js).

## Project layout

```
prisma/schema.prisma        data model
prisma/seed.mjs             demo data (refuses to run in production)
src/lib/auth.js             password hashing, DB-backed sessions
src/lib/access.js           requireDirector / requireJudge / requireContestant
src/lib/scoring.js          pure scoring and ranking logic (unit tested)
src/lib/photo-processing.js image validation and re-encoding (unit tested)
src/app/api/photos/         authorized photo delivery
src/app/actions/            server actions; every mutation re-checks role, status and ownership
src/app/manage/[id]/        director workspace
src/app/judge/[id]/         judge workspace
src/app/compete/[id]/       contestant workspace
src/app/invite/[token]/     invite acceptance
tests/                      node:test unit tests (npm test)
```

## Security notes

- Passwords are hashed with bcrypt (cost 12). Session tokens are random 256-bit values, stored only as SHA-256 hashes, and sent in `httpOnly`, `SameSite=Lax` cookies (`Secure` in production).
- Authorization is enforced in every server action and page, not in middleware. Users who lack access to a pageant get a 404.
- Judge invite links are always single-use. Contestant links can be single-use or reusable, and any link can be revoked.
- `Referrer-Policy: no-referrer` keeps invite tokens from leaking to other sites.

## Production checklist

- Switch the Prisma `provider` to `postgresql` and point `DATABASE_URL` at a managed database.
- Add rate limiting to login and registration.
- Add email delivery for invites and password resets (both are currently link-based or missing).
- Move photo storage to a private object store (e.g. S3 with no public access). The local disk doesn't survive redeploys and isn't shared across instances. Define a retention policy for contestant photos, which may include minors.
