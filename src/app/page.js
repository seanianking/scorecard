import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { ButtonLink } from "@/components/ui";

const FEATURES = [
  {
    title: "For directors",
    body: "Create a pageant, define age groups, bio questions, events and weighted judging criteria, then invite contestants and judges with a link.",
  },
  {
    title: "For contestants",
    body: "Accept an invite, choose your age division, and answer the director's bio questions. See your scores and judges' feedback when results are published.",
  },
  {
    title: "For judges",
    body: "Score each contestant event by event against the director's criteria and leave written feedback, from any device.",
  },
];

export default async function Home() {
  if (await getCurrentUser()) redirect("/dashboard");

  return (
    <div className="py-10">
      <section className="max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-wider text-plum-700">Pageant management</p>
        <h1 className="mt-2 font-display text-5xl leading-tight text-stone-900">
          Registration, judging and results, all on one scorecard.
        </h1>
        <p className="mt-4 text-lg text-stone-600">
          Scorecard gives pageant directors, contestants and judges one place to run a competition, from
          the first invite to the final tally.
        </p>
        <div className="mt-8 flex gap-3">
          <ButtonLink href="/register">Get started</ButtonLink>
          <ButtonLink href="/login" variant="secondary">
            Sign in
          </ButtonLink>
        </div>
      </section>
      <section className="mt-16 grid gap-6 md:grid-cols-3">
        {FEATURES.map((f) => (
          <div key={f.title} className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
            <h2 className="font-display text-xl text-plum-800">{f.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-stone-600">{f.body}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
