export type AiConfig = {
  baseUrl?: string;
  apiKey?: string;
  model?: string;
};

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export function resolveAiConfig(config: AiConfig) {
  const baseUrl = config.baseUrl || process.env.AI_BASE_URL;
  const apiKey = config.apiKey || process.env.AI_API_KEY;
  const model = config.model || process.env.AI_MODEL;

  if (!baseUrl || !apiKey || !model) {
    throw new Error("AI provider is not configured");
  }

  return { baseUrl: baseUrl.replace(/\/$/, ""), apiKey, model };
}

export async function createChatCompletion(messages: ChatMessage[], config: AiConfig = {}) {
  const resolved = resolveAiConfig(config);
  const response = await fetch(`${resolved.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${resolved.apiKey}`
    },
    body: JSON.stringify({
      model: resolved.model,
      messages,
      temperature: 0.4,
      response_format: { type: "json_object" }
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`AI request failed: ${response.status} ${text}`);
  }

  const payload = await response.json();
  const content = payload?.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    throw new Error("AI response did not include message content");
  }

  return content;
}
