"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";

import { AI_CONFIG_STORAGE_KEY, type StoredAiConfig } from "@/lib/settings/ai-config";

const initialConfig: StoredAiConfig = {
  baseUrl: "",
  apiKey: "",
  model: ""
};

export function AiSettingsForm() {
  const [config, setConfig] = useState(initialConfig);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(AI_CONFIG_STORAGE_KEY);
    if (raw) setConfig(JSON.parse(raw));
  }, []);

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    localStorage.setItem(AI_CONFIG_STORAGE_KEY, JSON.stringify(config));
    setSaved(true);
  }

  return (
    <form className="grid max-w-2xl gap-4 rounded-lg border border-line bg-white p-5" onSubmit={save}>
      <h1 className="text-xl font-semibold text-ink">AI 服务设置</h1>
      <label className="grid gap-2 text-sm">
        Base URL
        <input
          className="rounded border border-line px-3 py-2"
          value={config.baseUrl}
          onChange={(event) => setConfig({ ...config, baseUrl: event.target.value })}
          placeholder="https://api.openai.com/v1"
        />
      </label>
      <label className="grid gap-2 text-sm">
        API Key
        <input
          className="rounded border border-line px-3 py-2"
          value={config.apiKey}
          onChange={(event) => setConfig({ ...config, apiKey: event.target.value })}
          type="password"
        />
      </label>
      <label className="grid gap-2 text-sm">
        Model
        <input
          className="rounded border border-line px-3 py-2"
          value={config.model}
          onChange={(event) => setConfig({ ...config, model: event.target.value })}
          placeholder="gpt-4.1-mini"
        />
      </label>
      <button className="w-fit rounded bg-brand px-4 py-2 text-white" type="submit">
        保存设置
      </button>
      {saved ? <p className="text-sm text-success">已保存到当前浏览器。</p> : null}
    </form>
  );
}
