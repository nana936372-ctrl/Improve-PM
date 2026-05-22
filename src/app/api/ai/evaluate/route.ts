import { NextResponse } from "next/server";
import { z } from "zod";

import { createChatCompletion } from "@/lib/ai/client";
import { parseAiJson } from "@/lib/ai/json";
import { buildEvaluationPrompt } from "@/lib/ai/prompts";
import { evaluationSchema } from "@/lib/ai/schemas";
import { requireUser } from "@/lib/auth/guards";

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
  aiConfig: aiConfigSchema
});

export async function POST(request: Request) {
  await requireUser();
  const input = requestSchema.parse(await request.json());
  const messages = buildEvaluationPrompt({ question: input.question, answer: input.answer });
  const content = await createChatCompletion(messages, input.aiConfig);
  const evaluation = parseAiJson(content, evaluationSchema);
  return NextResponse.json({ evaluation });
}
