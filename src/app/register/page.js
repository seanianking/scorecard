import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, safeNextPath } from "@/lib/auth";
import { RegisterForm } from "@/components/auth/AuthForms";

export const metadata = { title: "Create account" };

export default async function RegisterPage({ searchParams }) {
  const { next } = await searchParams;
  if (await getCurrentUser()) redirect(safeNextPath(next));
  const nextQs = next ? `?next=${encodeURIComponent(next)}` : "";

  return (
    <div className="mx-auto max-w-sm py-8">
      <h1 className="font-display text-3xl text-stone-900">Create your account</h1>
      <p className="mt-1 mb-6 text-stone-600">
        One account works for every role: directing, competing or judging.
      </p>
      <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <RegisterForm next={next} />
      </div>
      <p className="mt-4 text-center text-sm text-stone-600">
        Already have an account?{" "}
        <Link href={`/login${nextQs}`} className="font-medium text-plum-700 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
