import { AppNav } from "@/components/layout/app-nav";
import { AiSettingsForm } from "@/components/settings/ai-settings-form";
import { requireUser } from "@/lib/auth/guards";

export default async function SettingsPage() {
  await requireUser();
  return (
    <>
      <AppNav />
      <main className="mx-auto max-w-7xl px-4 py-6">
        <AiSettingsForm />
      </main>
    </>
  );
}
