import { requireUser } from "@/lib/auth";
import { createPageant } from "@/app/actions/pageants";
import PageantForm from "@/components/manage/PageantForm";
import { PageHeader, Panel } from "@/components/ui";

export const metadata = { title: "New pageant" };

export default async function NewPageantPage() {
  await requireUser("/manage/new");
  return (
    <div className="max-w-2xl">
      <PageHeader
        title="New pageant"
        subtitle="Start with the basics. You'll add age groups, questions, events and criteria next."
      />
      <Panel>
        <PageantForm action={createPageant} submitLabel="Create pageant" />
      </Panel>
    </div>
  );
}
