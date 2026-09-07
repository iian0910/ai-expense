"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Avatar } from "@/components/Avatar";
import { OAuthButtons } from "@/components/OAuthButtons";

interface OAuthProfile {
  name: string;
  email: string;
  avatarUrl: string | null;
}

interface RegisterFormProps {
  oauthProfile?: OAuthProfile | null;
}

export function RegisterForm({ oauthProfile = null }: RegisterFormProps) {
  if (oauthProfile) {
    return <OAuthRegisterForm profile={oauthProfile} />;
  }
  return <StandardRegisterForm />;
}

function OAuthRegisterForm({ profile }: { profile: OAuthProfile }) {
  const router = useRouter();
  const [name, setName] = useState(profile.name);
  const [loading, setLoading] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/register/oauth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "註冊失敗");
      }

      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "註冊失敗");
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel() {
    setCancelling(true);
    try {
      await fetch("/api/auth/oauth/cancel", { method: "POST" });
    } finally {
      router.replace("/register");
      router.refresh();
    }
  }

  return (
    <div className="flex min-h-dvh justify-center bg-zinc-100 dark:bg-black">
      <div className="flex w-full max-w-md flex-col justify-center gap-6 px-6 py-16">
        <div className="flex flex-col items-center gap-3 text-center">
          <Avatar src={profile.avatarUrl} name={profile.name} size={64} />
          <div>
            <h1 className="text-2xl font-bold text-black dark:text-zinc-50">輕鬆記帳</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              使用 Google 帳號完成註冊
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            名稱
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm font-normal text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Email
            <input
              disabled
              value={profile.email}
              className="rounded-xl border border-zinc-300 bg-zinc-100 px-4 py-3 text-sm font-normal text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"
            />
          </label>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 rounded-full bg-foreground px-5 py-3 text-sm font-medium text-background transition-colors active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? "註冊中..." : "完成註冊"}
          </button>

          <button
            type="button"
            onClick={handleCancel}
            disabled={cancelling}
            className="text-center text-sm text-zinc-500 underline-offset-2 hover:underline disabled:opacity-50 dark:text-zinc-400"
          >
            改用 email 註冊
          </button>
        </form>

        <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
          已經有帳號了？{" "}
          <Link href="/login" className="font-medium text-black dark:text-zinc-50">
            前往登入
          </Link>
        </p>
      </div>
    </div>
  );
}

function StandardRegisterForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "註冊失敗");
      }

      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "註冊失敗");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-dvh justify-center bg-zinc-100 dark:bg-black">
      <div className="flex w-full max-w-md flex-col justify-center gap-6 px-6 py-16">
        <div className="flex flex-col gap-1 text-center">
          <h1 className="text-2xl font-bold text-black dark:text-zinc-50">
            輕鬆記帳
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">建立新帳號</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            名稱
            <input
              required
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm font-normal text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Email
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm font-normal text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            密碼
            <input
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm font-normal text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
            />
            <span className="text-xs font-normal text-zinc-400">至少 6 個字元</span>
          </label>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 rounded-full bg-foreground px-5 py-3 text-sm font-medium text-background transition-colors active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? "註冊中..." : "註冊"}
          </button>
        </form>

        <OAuthButtons label="or sign up with" />

        <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
          已經有帳號了？{" "}
          <Link href="/login" className="font-medium text-black dark:text-zinc-50">
            前往登入
          </Link>
        </p>
      </div>
    </div>
  );
}
