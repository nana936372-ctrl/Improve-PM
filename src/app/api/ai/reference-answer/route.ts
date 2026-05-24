import { NextResponse } from "next/server";
import { z } from "zod";

import { createChatCompletion } from "@/lib/ai/client";
import { parseAiJson } from "@/lib/ai/json";
import { buildReferenceAnswerPrompt } from "@/lib/ai/prompts";
import { evaluationSchema, generatedQuestionSchema, referenceAnswerSchema } from "@/lib/ai/schemas";
import { requireUser } from "@/lib/auth/guards";
import { buildChoiceReferenceAnswer } from "@/lib/training/reference-answer";

type PresentJsonValue = string | number | boolean | null | Record<string, unknown> | unknown[];

const aiConfigSchema = z
  .object({
    baseUrl: z.string().optional(),
    apiKey: z.string().optional(),
    model: z.string().optional()
  })
  .optional();
const requiredJsonValueSchema = z.custom<PresentJsonValue>((value) => value !== undefined, "Required");

const requestSchema = z.object({
  question: requiredJsonValueSchema,
  answer: requiredJsonValueSchema,
  evaluation: requiredJsonValueSchema,
  followups: z.array(z.unknown()).default([]),
  aiConfig: aiConfigSchema
});

export async function POST(request: Request) {
  await requireUser();
  const input = requestSchema.parse(await request.json());
  const question = generatedQuestionSchema.safeParse(input.question);

  if (question.success && (question.data.type === "single_choice" || question.data.type === "multiple_choice")) {
    const evaluation = evaluationSchema.parse(input.evaluation);
    return NextResponse.json({
      referenceAnswer: buildChoiceReferenceAnswer({ question: question.data, evaluation })
    });
  }

  const messages = buildReferenceAnswerPrompt(input);
  const content = await createChatCompletion(messages, input.aiConfig);
  const referenceAnswer = parseAiJson(content, referenceAnswerSchema);
  return NextResponse.json({ referenceAnswer });
}
