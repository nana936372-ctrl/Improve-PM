import { AppNav } from "@/components/layout/app-nav";
import { GrowthDashboard } from "@/components/history/growth-dashboard";
import { requireUser } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";

export default async function HistoryPage() {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: sessions } = await supabase
    .from("training_sessions")
    .select(
      `
      id,
      title,
      question_type,
      difficulty,
      overall_score,
      completed_at,
      session_questions(title,prompt,scenario,options,rubric,reference_answer),
      user_responses(selected_options,text_answer,submitted_at),
      evaluations(overall_score,dimension_scores,strengths,gaps,advice,option_analysis),
      followup_turns(turn_index,question,intent,user_answer)
    `
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  const { data: snapshots } = await supabase
    .from("ability_snapshots")
    .select("ability_key,score,max_score,created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(60);

  return (
    <>
      <AppNav />
      <main className="mx-auto max-w-7xl px-4 py-6">
        <GrowthDashboard sessions={sessions ?? []} snapshots={snapshots ?? []} />
      </main>
    </>
  );
}
