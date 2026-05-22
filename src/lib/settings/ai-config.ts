export type StoredAiConfig = {
  baseUrl: string;
  apiKey: string;
  model: string;
};

export const AI_CONFIG_STORAGE_KEY = "ai-pm-trainer-ai-config";

export function isCompleteAiConfig(config: Partial<StoredAiConfig>) {
  return Boolean(config.baseUrl && config.apiKey && config.model);
}
