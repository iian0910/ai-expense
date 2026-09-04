"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { AlertModal } from "@/components/AlertModal";
import { ConfirmModal } from "@/components/ConfirmModal";
import { Avatar } from "@/components/Avatar";
import {
  formatMonth,
  getCategoryIcon,
  getDaysInMonth,
  toDateKey,
  type ExpenseItem,
} from "@/lib/expenses";
import { useSpeechRecognition } from "@/lib/useSpeechRecognition";

type SidebarTab = "menu" | "settings";

export default function Home() {
  const router = useRouter();
  const user = useAuth();
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDay, setSelectedDay] = useState(() => new Date().getDate());
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>("menu");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const dayStripRef = useRef<HTMLDivElement>(null);
  const baseTextRef = useRef("");
  const finalTranscriptRef = useRef("");
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const {
    isSupported: speechSupported,
    isListening,
    error: speechError,
    start: startListening,
    stop: stopListening,
    clearError: clearSpeechError,
  } = useSpeechRecognition("zh-TW");

  const daysInMonth = getDaysInMonth(currentMonth);
  const selectedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), selectedDay);
  const dateKey = toDateKey(selectedDate);

  async function loadExpenses() {
    const res = await fetch(`/api/expenses?date=${dateKey}`);
    const data = await res.json();
    if (res.ok) setExpenses(data.expenses ?? []);
  }

  useEffect(() => {
    let ignore = false;

    fetch(`/api/expenses?date=${dateKey}`)
      .then((res) => res.json())
      .then((data) => {
        if (!ignore) setExpenses(data.expenses ?? []);
      });

    return () => {
      ignore = true;
    };
  }, [dateKey]);

  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!text.trim()) return;

    setLoading(true);

    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Request failed");
      }

      stopListening();
      setText("");
      setShowAddSheet(false);
      await loadExpenses();
    } catch (err) {
      setAlertMessage(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function handleDelete(id: string) {
    setConfirmDeleteId(id);
  }

  async function performDelete() {
    const id = confirmDeleteId;
    if (!id) return;

    setConfirmDeleteId(null);
    setDeletingId(id);

    try {
      const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "刪除失敗");
      }
      setExpenses((prev) => prev.filter((item) => item._id !== id));
    } catch (err) {
      setAlertMessage(err instanceof Error ? err.message : "刪除失敗");
    } finally {
      setDeletingId(null);
    }
  }

  function toggleListening() {
    if (isListening) {
      stopListening();
      return;
    }

    baseTextRef.current = text;
    finalTranscriptRef.current = "";
    startListening((chunk, isFinal) => {
      if (isFinal) {
        finalTranscriptRef.current += chunk;
        setText(`${baseTextRef.current}${finalTranscriptRef.current}`);
      } else {
        setText(`${baseTextRef.current}${finalTranscriptRef.current}${chunk}`);
      }
    });
  }

  function closeAddSheet() {
    stopListening();
    setShowAddSheet(false);
  }

  function openMenu() {
    setSidebarTab("menu");
    setShowMenu(true);
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setAlertMessage("請選擇圖片檔案");
      return;
    }

    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/user/avatar", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "上傳失敗");
      }

      setAvatarUrl(data.avatarUrl);
      router.refresh();
    } catch (err) {
      setAlertMessage(err instanceof Error ? err.message : "上傳失敗");
    } finally {
      setUploadingAvatar(false);
    }
  }

  const sortedExpenses = useMemo(
    () =>
      [...expenses].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    [expenses]
  );

  useEffect(() => {
    dayStripRef.current
      ?.querySelector(`[data-day="${selectedDay}"]`)
      ?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [selectedDay, currentMonth]);

  function changeMonth(offset: number) {
    const next = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + offset, 1);
    const daysInNext = getDaysInMonth(next);
    setCurrentMonth(next);
    setSelectedDay((day) => Math.min(day, daysInNext));
  }

  return (
    <div className="flex h-dvh justify-center overflow-hidden bg-zinc-100 dark:bg-black">
      <div className="flex h-full w-full max-w-md flex-col">
        {/* Header */}
        <header className="flex shrink-0 flex-col gap-3 border-b border-zinc-200 bg-zinc-100 px-4 pt-4 pb-3 dark:border-zinc-800 dark:bg-black">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold text-black dark:text-zinc-50">
              輕鬆記帳
            </h1>
            <button
              onClick={openMenu}
              aria-label="開啟選單"
              aria-expanded={showMenu}
              className="shrink-0 overflow-hidden rounded-full shadow-sm active:scale-95"
            >
              <Avatar src={avatarUrl} name={user.name} size={36} />
            </button>
          </div>

          {/* Month selector */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => changeMonth(-1)}
              aria-label="上個月"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-zinc-600 shadow-sm active:scale-95 dark:bg-zinc-900 dark:text-zinc-300"
            >
              ‹
            </button>
            <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
              {formatMonth(currentMonth)}
            </span>
            <button
              onClick={() => changeMonth(1)}
              aria-label="下個月"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-zinc-600 shadow-sm active:scale-95 dark:bg-zinc-900 dark:text-zinc-300"
            >
              ›
            </button>
          </div>

          {/* Day selector */}
          <div
            ref={dayStripRef}
            className="flex gap-2 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
              const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
              const isSelected = day === selectedDay;
              const isToday = toDateKey(date) === toDateKey(new Date());

              return (
                <button
                  key={day}
                  data-day={day}
                  onClick={() => setSelectedDay(day)}
                  aria-label={`${date.getMonth() + 1}月${day}日`}
                  className={`flex h-12 w-12 shrink-0 flex-col items-center justify-center gap-0.5 rounded-2xl text-sm font-semibold shadow-sm active:scale-95 ${
                    isSelected
                      ? "bg-foreground text-background"
                      : "bg-white text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300"
                  }`}
                >
                  <span>{day}</span>
                  {isToday && !isSelected && (
                    <span className="h-1 w-1 rounded-full bg-foreground" />
                  )}
                </button>
              );
            })}
          </div>
        </header>

        {/* Records for the selected day — the only scrollable region */}
        <main className="min-h-0 flex-1 overflow-y-auto px-4 pt-4 pb-28">
          {sortedExpenses.length === 0 ? (
            <p className="py-12 text-center text-sm text-zinc-400">
              這天尚無記帳資料
            </p>
          ) : (
            <div className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-zinc-900">
              {sortedExpenses.map((item, idx) => (
                <div
                  key={item._id}
                  className={`flex items-center gap-3 px-4 py-3 ${
                    idx !== sortedExpenses.length - 1
                      ? "border-b border-zinc-100 dark:border-zinc-800"
                      : ""
                  }`}
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-base dark:bg-zinc-800">
                    {getCategoryIcon(item.category, item.type)}
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm font-medium text-zinc-800 dark:text-zinc-100">
                      {item.description || item.rawText}
                    </span>
                    <span className="text-xs text-zinc-400">{item.category}</span>
                  </div>
                  <span
                    className={`shrink-0 text-sm font-semibold ${
                      item.type === "expense" ? "text-red-500" : "text-emerald-600"
                    }`}
                  >
                    {item.type === "expense" ? "-" : "+"}
                    {item.amount.toLocaleString("zh-TW")}
                  </span>
                  <button
                    onClick={() => handleDelete(item._id)}
                    disabled={deletingId === item._id}
                    aria-label="刪除紀錄"
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-zinc-400 active:scale-95 disabled:opacity-40 dark:text-zinc-500"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          )}
        </main>

        {/* Floating add button */}
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20 flex justify-center">
          <div className="relative w-full max-w-md">
            <button
              onClick={() => setShowAddSheet(true)}
              aria-label="新增記帳"
              className="pointer-events-auto absolute bottom-8 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-foreground text-2xl text-background shadow-xl active:scale-95"
            >
              +
            </button>
          </div>
        </div>

        {/* Bottom sheet */}
        {showAddSheet && (
          <div
            className="fixed inset-0 z-30 flex items-end justify-center bg-black/40"
            onClick={closeAddSheet}
          >
            <form
              onSubmit={handleSubmit}
              onClick={(e) => e.stopPropagation()}
              className="flex w-full max-w-md flex-col gap-3 rounded-t-3xl bg-white p-5 pb-8 dark:bg-zinc-900"
            >
              <div className="mx-auto h-1 w-10 rounded-full bg-zinc-300 dark:bg-zinc-700" />
              <h2 className="text-base font-semibold text-black dark:text-zinc-50">
                新增記帳
              </h2>
              <div className="relative">
                <textarea
                  autoFocus
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="例如：午餐買了排骨便當 120 元，或按右下角麥克風直接說"
                  rows={3}
                  className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 pr-12 text-sm dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
                />
                {speechSupported && (
                  <button
                    type="button"
                    onClick={toggleListening}
                    aria-label={isListening ? "停止語音輸入" : "開始語音輸入"}
                    aria-pressed={isListening}
                    className={`absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-full text-base shadow-sm active:scale-95 ${
                      isListening
                        ? "animate-pulse bg-red-500 text-white"
                        : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                    }`}
                  >
                    🎤
                  </button>
                )}
              </div>

              {isListening && (
                <p className="text-xs text-red-500">聆聽中，請開口說話…</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="rounded-full bg-foreground px-5 py-3 text-sm font-medium text-background transition-colors active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? "分析中..." : "送出"}
              </button>
            </form>
          </div>
        )}

        {/* Sidebar menu overlay */}
        <div
          onClick={() => setShowMenu(false)}
          className={`fixed inset-0 z-40 bg-black/40 transition-opacity ${
            showMenu ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
        />

        {/* Sidebar menu panel */}
        <div
          className={`fixed inset-y-0 right-0 z-50 flex h-dvh w-72 max-w-[85%] flex-col bg-white shadow-xl transition-transform duration-300 dark:bg-zinc-900 ${
            showMenu ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex items-center gap-3 border-b border-zinc-100 px-4 py-4 dark:border-zinc-800">
            <Avatar src={avatarUrl} name={user.name} size={44} />
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm font-semibold text-zinc-800 dark:text-zinc-100">
                {user.name}
              </span>
              <span className="truncate text-xs text-zinc-400">{user.email}</span>
            </div>
            <button
              onClick={() => setShowMenu(false)}
              aria-label="關閉選單"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-zinc-400 active:scale-95"
            >
              ✕
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 border-b border-zinc-100 px-2 pt-2 dark:border-zinc-800">
            <button
              onClick={() => setSidebarTab("menu")}
              className={`flex-1 border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
                sidebarTab === "menu"
                  ? "border-foreground text-foreground"
                  : "border-transparent text-zinc-400"
              }`}
            >
              選單
            </button>
            <button
              onClick={() => setSidebarTab("settings")}
              className={`flex-1 border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
                sidebarTab === "settings"
                  ? "border-foreground text-foreground"
                  : "border-transparent text-zinc-400"
              }`}
            >
              設置
            </button>
          </div>

          {sidebarTab === "menu" ? (
            <nav className="flex flex-col gap-1 p-2">
              <Link
                href="/stats"
                onClick={() => setShowMenu(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-zinc-700 active:bg-zinc-100 dark:text-zinc-200 dark:active:bg-zinc-800"
              >
                <span className="text-lg">📊</span> 統計
              </Link>
              <button
                onClick={() => {
                  setShowMenu(false);
                  handleLogout();
                }}
                className="flex items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-red-500 active:bg-zinc-100 dark:active:bg-zinc-800"
              >
                <span className="text-lg">🚪</span> 登出
              </button>
            </nav>
          ) : (
            <div className="flex flex-col items-center gap-4 p-6">
              <Avatar src={avatarUrl} name={user.name} size={88} />
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
              <button
                onClick={() => avatarInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background active:scale-95 disabled:opacity-50"
              >
                {uploadingAvatar ? "上傳中..." : "更換頭像"}
              </button>
              <p className="text-center text-xs text-zinc-400">
                支援 JPG、PNG、WebP，檔案大小 5MB 以內
              </p>
            </div>
          )}
        </div>

        <ConfirmModal
          open={!!confirmDeleteId}
          title="刪除紀錄"
          message="確定要刪除這筆紀錄嗎？此動作無法復原。"
          confirmText="刪除"
          danger
          onConfirm={performDelete}
          onCancel={() => setConfirmDeleteId(null)}
        />

        <AlertModal
          message={alertMessage ?? speechError}
          onClose={() => {
            setAlertMessage(null);
            clearSpeechError();
          }}
        />
      </div>
    </div>
  );
}
