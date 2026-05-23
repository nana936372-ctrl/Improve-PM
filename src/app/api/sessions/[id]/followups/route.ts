import { NextResponse } from "next/server";
import { z } from "zod";

import { requireUser } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";

const requestSchema = z.object({
  followups: z.array(
    z.object({
      question: z.string(),
      intent: z.string().optional(),
      answer: z.string().optional()
    })
  )
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const input = requestSchema.parse(await request.json());
  const supabase = await createClient();

  const { error: sessionError } = await supabase.from("training_sessions").select("id").eq("id", id).eq("user_id", user.id).single();
  if (sessionError) throw sessionError;

  if (input.followups.length) {
    const { error: followupError } = await supabase.from("followup_turns").upsert(
      input.followups.map((turn, index) => ({
        session_id: id,
        user_id: user.id,
        turn_index: index + 1,
        question: turn.question,
        intent: turn.intent ?? null,
        user_answer: turn.answer ?? null
      })),
      { onConflict: "session_id,turn_index" }
    );
    if (followupError) throw followupError;
  }

  return NextResponse.json({ ok: true });
}
