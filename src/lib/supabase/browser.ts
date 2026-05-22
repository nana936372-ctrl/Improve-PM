import { createBrowserClient } from "@supabase/ssr";

import { resolveSupabasePublicConfig } from "./config";

export function createClient() {
  const config = resolveSupabasePublicConfig();

  if (!config) {
    throw new Error("Missing Supabase browser environment variables");
  }

  return createBrowserClient(config.url, config.key);
}
