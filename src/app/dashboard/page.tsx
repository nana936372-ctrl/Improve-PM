import { AppNav } from "@/components/layout/app-nav";
import { TrainingWorkbench } from "@/components/training/training-workbench";
import { requireUser } from "@/lib/auth/guards";

export default async function DashboardPage() {
  await requireUser();
  return (
    <>
      <AppNav />
      <main className="mx-auto max-w-7xl px-4 py-6">
        <TrainingWorkbench />
      </main>
    </>
  );
}
