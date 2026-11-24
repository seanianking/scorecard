import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { formatDate } from "@/lib/age";
import { acceptInvite } from "@/app/actions/people";
import AcceptInvite from "@/components/AcceptInvite";
import { ButtonLink, Notice } from "@/components/ui";

export const metadata = { title: "You're invited" };

function Shell({ children }) {
  return <div className="mx-auto max-w-md py-8">{children}</div>;
}

export default async function InvitePage({ params }) {
  const { token } = await params;
  const invite = await db.invite.findUnique({
    where: { token },
    include: { pageant: { include: { director: { select: { name: true } } } } },
  });

  const invalid = !invite || invite.revokedAt || (invite.singleUse && invite.uses > 0);
  if (invalid) {
    return (
      <Shell>
        <h1 className="font-display text-3xl text-stone-900">Invite unavailable</h1>
        <p className="mt-2 text-stone-600">
          This invite link has been used or revoked, or it doesn't exist. Ask the pageant director for a new one.
        </p>
      </Shell>
    );
  }

  const { pageant } = invite;
  const isJudge = invite.role === "JUDGE";
  const user = await getCurrentUser();
  const here = `/invite/${encodeURIComponent(token)}`;

  let blocker = null;
  if (isJudge && pageant.status === "COMPLETE") blocker = "This pageant has finished.";
  if (!isJudge && pageant.status !== "REGISTRATION") {
    blocker =
      pageant.status === "SETUP"
        ? "Registration hasn't opened yet. This link will work once the director opens it."
        : "Registration for this pageant has closed.";
  }

  return (
    <Shell>
      <p className="text-sm font-semibold uppercase tracking-wider text-plum-700">
        You're invited to {isJudge ? "judge" : "compete"}
      </p>
      <h1 className="mt-1 font-display text-3xl text-stone-900">{pageant.name}</h1>
      <p className="mt-1 text-sm text-stone-500">
        {[formatDate(pageant.eventDate), pageant.location, `Directed by ${pageant.director.name}`]
          .filter(Boolean)
          .join(" · ")}
      </p>
      {pageant.description && <p className="mt-4 whitespace-pre-wrap text-stone-700">{pageant.description}</p>}

      <div className="mt-6 rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        {blocker ? (
          <Notice tone="amber">{blocker}</Notice>
        ) : user ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-stone-600">
              Signed in as <span className="font-medium text-stone-900">{user.email}</span>.
            </p>
            <AcceptInvite
              action={acceptInvite.bind(null, token)}
              label={isJudge ? "Accept and start judging" : "Accept and register"}
            />
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-stone-600">Create an account or sign in to accept this invitation.</p>
            <ButtonLink href={`/register?next=${encodeURIComponent(here)}`}>Create account</ButtonLink>
            <ButtonLink href={`/login?next=${encodeURIComponent(here)}`} variant="secondary">
              I already have an account
            </ButtonLink>
          </div>
        )}
      </div>
    </Shell>
  );
}
