"use client";

import type { FormEvent } from "react";
import { useMemo, useState } from "react";

import { createClient } from "@/lib/supabase/browser";

export function AuthForm() {
  const supabase = useMemo(() => createClient(), []);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setMessage("");

    const result =
      mode === "login"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });

    setIsLoading(false);

    if (result.error) {
      setMessage(result.error.message);
      return;
    }

    window.location.href = "/dashboard";
  }

  return (
    <div className="mx-auto w-full max-w-md rounded-lg border border-line bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-semibold text-ink">AI 产品经理思维训练器</h1>
      <p className="mt-2 text-sm text-muted">登录后开始训练你的 AI 产品判断力。</p>
      <form className="mt-6 grid gap-4" onSubmit={submit}>
        <label className="grid gap-2 text-sm">
          邮箱
          <input
            className="rounded border border-line px-3 py-2"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            type="email"
            required
          />
        </label>
        <label className="grid gap-2 text-sm">
          密码
          <input
            className="rounded border border-line px-3 py-2"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            minLength={6}
            required
          />
        </label>
        {message ? <p className="rounded bg-red-50 px-3 py-2 text-sm text-danger">{message}</p> : null}
        <button className="rounded bg-brand px-4 py-2 text-white disabled:opacity-60" disabled={isLoading} type="submit">
          {isLoading ? "处理中..." : mode === "login" ? "登录" : "注册"}
        </button>
      </form>
      <button className="mt-4 text-sm text-brand" type="button" onClick={() => setMode(mode === "login" ? "register" : "login")}>
        {mode === "login" ? "没有账号？去注册" : "已有账号？去登录"}
      </button>
    </div>
  );
}
