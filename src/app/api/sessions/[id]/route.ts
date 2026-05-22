import { NextResponse } from "next/server";
import { z } from "zod";

import { evaluationSchema } from "@/lib/ai/schemas";
import { requireUser } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { buildAbilitySnapshots } from "@/lib/training/persistence";

const updateSchema = z.object({
  answer: z.object({
    selectedOptions: z.array(z.string()).optional(),
    textAnswer: z.string().optional()
  }),
  evaluation: evaluationSchema
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const input = updateSchema.parse(await request.json());
  const supabase = await createClient();

  const { error: responseError } = await supabase.from("user_responses").insert({
    session_id: id,
    user_id: user.id,
    selected_options: input.answer.selectedOptions ?? null,
    text_answer: input.answer.textAnswer ?? null,
    is_draft: false,
    submitted_at: new Date().toISOString()
  });
  if (responseError) throw responseError;

  const { error: evaluationError } = await supabase.from("evaluations").insert({
    session_id: id,
    user_id: user.id,
    overall_score: input.evaluation.overallScore,
    dimension_scores: input.evaluation.dimensionScores,
    strengths: input.evaluation.strengths,
    gaps: input.evaluation.gaps,
    advice: input.evaluation.advice,
    option_analysis: input.evaluation.optionAnalysis ?? null
  });
  if (evaluationError) throw evaluationError;

  const { error: snapshotError } = await supabase.from("ability_snapshots").insert(buildAbilitySnapshots(id, user.id, input.evaluation));
  if (snapshotError) throw snapshotError;

  const { error: sessionError } = await supabase
    .from("training_sessions")
    .update({ status: "evaluated", overall_score: input.evaluation.overallScore, completed_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);
  if (sessionError) throw sessionError;

  return NextResponse.json({ ok: true });
}
