import { NextResponse } from "next/server";
import { z } from "zod";

import { createChatCompletion } from "@/lib/ai/client";
import { parseAiJson } from "@/lib/ai/json";
import { buildFollowupPrompt } from "@/lib/ai/prompts";
import { followupSchema } from "@/lib/ai/schemas";
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
  evaluation: requiredJsonValueSchema,
  previousAnswers: z.array(z.unknown()).default([]),
  aiConfig: aiConfigSchema
});

export async function POST(request: Request) {
  await requireUser();
  const input = requestSchema.parse(await request.json());
  const messages = buildFollowupPrompt(input);
  const content = await createChatCompletion(messages, input.aiConfig);
  const followup = parseAiJson(content, followupSchema);
  return NextResponse.json({ followup });
}
