"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Phase = "form" | "loading" | "success" | "error";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phase, setPhase] = useState<Phase>("form");
  const [error, setError] = useState<string | null>(null);

  const isTransitioning = phase !== "form";

  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setPhase("loading");
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "登入失敗");
      }

      setPhase("success");
      window.setTimeout(() => {
        router.push("/");
        router.refresh();
      }, 700);
    } catch (err) {
      setError(err instanceof Error ? err.message : "登入失敗");
      setPhase("error");
      window.setTimeout(() => setPhase("form"), 1100);
    }
  }

  return (
    <div className="relative flex min-h-dvh justify-center overflow-hidden bg-zinc-100 dark:bg-black">
      <div className="flex w-full max-w-md flex-col justify-center gap-6 px-6 py-16">
        <div className="flex flex-col gap-1 text-center">
          <h1 className="text-2xl font-bold text-black dark:text-zinc-50">
            輕鬆記帳
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">登入你的帳號</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Email
            <input
              type="email"
              required
              autoComplete="email"
              disabled={isTransitioning}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm font-normal text-zinc-900 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            密碼
            <input
              type="password"
              required
              autoComplete="current-password"
              disabled={isTransitioning}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm font-normal text-zinc-900 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
            />
          </label>

          {phase === "form" && error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={isTransitioning}
            className="mt-2 rounded-full bg-foreground px-5 py-3 text-sm font-medium text-background transition-colors active:scale-[0.98] disabled:opacity-50"
          >
            登入
          </button>
        </form>

        <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
          還沒有帳號？{" "}
          <Link href="/register" className="font-medium text-black dark:text-zinc-50">
            立即註冊
          </Link>
        </p>
      </div>

      {/* Transition overlay */}
      <div
        aria-hidden={!isTransitioning}
        className={`absolute inset-0 flex flex-col items-center justify-center gap-4 bg-zinc-100 transition-opacity duration-300 dark:bg-black ${
          isTransitioning ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        {phase === "loading" && (
          <>
            <span className="h-12 w-12 animate-spin rounded-full border-4 border-zinc-300 border-t-foreground dark:border-zinc-700" />
            <p className="text-sm text-zinc-500 dark:text-zinc-400">登入中...</p>
          </>
        )}

        {phase === "success" && (
          <>
            <span className="animate-pop-in flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-2xl text-white">
              ✓
            </span>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">登入成功</p>
          </>
        )}

        {phase === "error" && (
          <>
            <span className="animate-pop-in flex h-14 w-14 items-center justify-center rounded-full bg-red-500 text-2xl text-white">
              ✕
            </span>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{error}</p>
          </>
        )}
      </div>
    </div>
  );
}
