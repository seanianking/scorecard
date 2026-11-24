import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, safeNextPath } from "@/lib/auth";
import { LoginForm } from "@/components/auth/AuthForms";

export const metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }) {
  const { next } = await searchParams;
  if (await getCurrentUser()) redirect(safeNextPath(next));
  const nextQs = next ? `?next=${encodeURIComponent(next)}` : "";

  return (
    <div className="mx-auto max-w-sm py-8">
      <h1 className="font-display text-3xl text-stone-900">Welcome back</h1>
      <p className="mt-1 mb-6 text-stone-600">Sign in to your Scorecard account.</p>
      <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <LoginForm next={next} />
      </div>
      <p className="mt-4 text-center text-sm text-stone-600">
        New here?{" "}
        <Link href={`/register${nextQs}`} className="font-medium text-plum-700 hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
