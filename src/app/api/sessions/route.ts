import { NextResponse } from "next/server";
import { z } from "zod";

import { requireUser } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";

const createSchema = z.object({
  question: z.object({
    type: z.enum(["single_choice", "multiple_choice", "case_analysis"]),
    title: z.string(),
    prompt: z.string(),
    scenario: z.string().optional(),
    options: z.unknown().optional(),
    correctOptions: z.array(z.string()).optional(),
    abilityKeys: z.array(z.string()),
    difficulty: z.enum(["beginner", "intermediate", "advanced"]),
    rubric: z.string().optional()
  })
});

export async function POST(request: Request) {
  const user = await requireUser();
  const input = createSchema.parse(await request.json());
  const supabase = await createClient();

  const { data: session, error: sessionError } = await supabase
    .from("training_sessions")
    .insert({
      user_id: user.id,
      question_type: input.question.type,
      status: "generated",
      difficulty: input.question.difficulty,
      ability_keys: input.question.abilityKeys,
      title: input.question.title
    })
    .select("id")
    .single();

  if (sessionError) throw sessionError;

  const { error: questionError } = await supabase.from("session_questions").insert({
    session_id: session.id,
    user_id: user.id,
    question_type: input.question.type,
    title: input.question.title,
    prompt: input.question.prompt,
    scenario: input.question.scenario,
    options: input.question.options ?? null,
    correct_options: input.question.correctOptions ?? null,
    rubric: input.question.rubric ? { text: input.question.rubric } : null
  });

  if (questionError) throw questionError;

  return NextResponse.json({ sessionId: session.id });
}
