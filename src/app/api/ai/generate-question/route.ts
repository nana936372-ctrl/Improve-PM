import { NextResponse } from "next/server";
import { z } from "zod";

import { createChatCompletion } from "@/lib/ai/client";
import { parseAiJson } from "@/lib/ai/json";
import { buildQuestionPrompt } from "@/lib/ai/prompts";
import { generatedQuestionSchema } from "@/lib/ai/schemas";
import { requireUser } from "@/lib/auth/guards";
import { ABILITY_KEYS, type AbilityKey } from "@/lib/constants/abilities";

const aiConfigSchema = z
  .object({
    baseUrl: z.string().optional(),
    apiKey: z.string().optional(),
    model: z.string().optional()
  })
  .optional();

const requestSchema = z.object({
  questionType: z.enum(["single_choice", "multiple_choice", "case_analysis"]),
  abilityKeys: z
    .array(z.custom<AbilityKey>((value) => typeof value === "string" && (ABILITY_KEYS as readonly string[]).includes(value)))
    .min(1),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
  scenePreference: z.string().optional(),
  aiConfig: aiConfigSchema
});

export async function POST(request: Request) {
  await requireUser();
  const input = requestSchema.parse(await request.json());
  const messages = buildQuestionPrompt(input);
  const content = await createChatCompletion(messages, input.aiConfig);
  const question = parseAiJson(content, generatedQuestionSchema);
  return NextResponse.json({ question });
}
