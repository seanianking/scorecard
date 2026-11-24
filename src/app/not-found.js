import { ButtonLink } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <h1 className="font-display text-3xl text-stone-900">Page not found</h1>
      <p className="mt-2 text-stone-600">This page doesn't exist, or you don't have access to it.</p>
      <div className="mt-6">
        <ButtonLink href="/dashboard">Go to dashboard</ButtonLink>
      </div>
    </div>
  );
}
