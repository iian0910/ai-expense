"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  computeCategoryTotals,
  computeMonthlyTotals,
  formatCurrency,
  formatMonth,
  formatMonthParam,
  formatYear,
  formatYearParam,
  getCategoryIcon,
  sumByType,
  type ExpenseItem,
} from "@/lib/expenses";

type View = "month" | "year";

export default function StatsPage() {
  const [view, setView] = useState<View>("month");
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [currentYear, setCurrentYear] = useState(() => new Date(new Date().getFullYear(), 0, 1));
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);

  const monthParam = formatMonthParam(currentMonth);
  const yearParam = formatYearParam(currentYear);

  useEffect(() => {
    let ignore = false;
    const rangeParam = view === "month" ? `month=${monthParam}` : `year=${yearParam}`;

    fetch(`/api/expenses?${rangeParam}`)
      .then((res) => res.json())
      .then((data) => {
        if (!ignore) setExpenses(data.expenses ?? []);
      });

    return () => {
      ignore = true;
    };
  }, [view, monthParam, yearParam]);

  const totalExpense = useMemo(() => sumByType(expenses, "expense"), [expenses]);
  const totalIncome = useMemo(() => sumByType(expenses, "income"), [expenses]);
  const categoryTotals = useMemo(() => computeCategoryTotals(expenses), [expenses]);
  const maxCategoryAmount = categoryTotals[0]?.amount ?? 0;

  const monthlyTotals = useMemo(() => computeMonthlyTotals(expenses), [expenses]);
  const maxMonthlyAmount = useMemo(
    () => Math.max(0, ...monthlyTotals.map((m) => m.amount)),
    [monthlyTotals]
  );

  function changeMonth(offset: number) {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
  }

  function changeYear(offset: number) {
    setCurrentYear((prev) => new Date(prev.getFullYear() + offset, 0, 1));
  }

  return (
    <div className="flex h-dvh justify-center overflow-hidden bg-zinc-100 dark:bg-black">
      <div className="flex h-full w-full max-w-md flex-col">
        {/* Header */}
        <header className="flex shrink-0 flex-col gap-3 border-b border-zinc-200 bg-zinc-100 px-4 pt-4 pb-3 dark:border-zinc-800 dark:bg-black">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              aria-label="返回"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-zinc-600 shadow-sm active:scale-95 dark:bg-zinc-900 dark:text-zinc-300"
            >
              ‹
            </Link>
            <h1 className="text-lg font-bold text-black dark:text-zinc-50">
              統計
            </h1>
          </div>

          {/* Month / Year tabs */}
          <div className="flex gap-1 rounded-full bg-zinc-200 p-1 dark:bg-zinc-900">
            <button
              onClick={() => setView("month")}
              className={`flex-1 rounded-full py-1.5 text-sm font-medium transition-colors ${
                view === "month"
                  ? "bg-white text-black shadow-sm dark:bg-zinc-700 dark:text-zinc-50"
                  : "text-zinc-500 dark:text-zinc-400"
              }`}
            >
              月度統計
            </button>
            <button
              onClick={() => setView("year")}
              className={`flex-1 rounded-full py-1.5 text-sm font-medium transition-colors ${
                view === "year"
                  ? "bg-white text-black shadow-sm dark:bg-zinc-700 dark:text-zinc-50"
                  : "text-zinc-500 dark:text-zinc-400"
              }`}
            >
              年度統計
            </button>
          </div>

          {/* Period navigator */}
          {view === "month" ? (
            <div className="flex items-center justify-between">
              <button
                onClick={() => changeMonth(-1)}
                aria-label="上個月"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-zinc-600 shadow-sm active:scale-95 dark:bg-zinc-900 dark:text-zinc-300"
              >
                ‹
              </button>
              <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
                {formatMonth(currentMonth)}
              </span>
              <button
                onClick={() => changeMonth(1)}
                aria-label="下個月"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-zinc-600 shadow-sm active:scale-95 dark:bg-zinc-900 dark:text-zinc-300"
              >
                ›
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <button
                onClick={() => changeYear(-1)}
                aria-label="上一年"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-zinc-600 shadow-sm active:scale-95 dark:bg-zinc-900 dark:text-zinc-300"
              >
                ‹
              </button>
              <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
                {formatYear(currentYear)}
              </span>
              <button
                onClick={() => changeYear(1)}
                aria-label="下一年"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-zinc-600 shadow-sm active:scale-95 dark:bg-zinc-900 dark:text-zinc-300"
              >
                ›
              </button>
            </div>
          )}
        </header>

        {/* Scrollable content */}
        <main className="min-h-0 flex-1 overflow-y-auto px-4 pt-4 pb-8">
          <section className="flex flex-col gap-4 rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-500 p-5 text-white shadow-lg shadow-indigo-200">
            <div>
              <p className="text-xs text-blue-100">
                {view === "month" ? "本月支出" : "本年支出"}
              </p>
              <p className="text-3xl font-bold tracking-tight">
                {formatCurrency(totalExpense)}
              </p>
            </div>
            {totalIncome > 0 && (
              <div className="flex items-center gap-1 text-xs text-blue-100">
                <span>{view === "month" ? "本月收入" : "本年收入"}</span>
                <span className="font-medium text-emerald-200">
                  {formatCurrency(totalIncome)}
                </span>
              </div>
            )}
          </section>

          {view === "year" && (
            <section className="mt-5 flex flex-col gap-2">
              <h2 className="px-1 text-sm font-semibold text-zinc-600 dark:text-zinc-300">
                月份趨勢
              </h2>
              <div className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-zinc-900">
                {monthlyTotals.map(({ month, amount }, idx) => (
                  <div
                    key={month}
                    className={`flex items-center gap-3 px-4 py-2.5 ${
                      idx !== monthlyTotals.length - 1
                        ? "border-b border-zinc-100 dark:border-zinc-800"
                        : ""
                    }`}
                  >
                    <span className="w-9 shrink-0 text-sm font-medium text-zinc-500 dark:text-zinc-400">
                      {month} 月
                    </span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                      <div
                        className="h-full rounded-full bg-zinc-700 dark:bg-zinc-400"
                        style={{
                          width: `${
                            maxMonthlyAmount ? (amount / maxMonthlyAmount) * 100 : 0
                          }%`,
                        }}
                      />
                    </div>
                    <span className="w-20 shrink-0 text-right text-sm font-semibold text-zinc-700 dark:text-zinc-200">
                      {amount > 0 ? formatCurrency(amount) : "-"}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="mt-5 flex flex-col gap-2">
            <h2 className="px-1 text-sm font-semibold text-zinc-600 dark:text-zinc-300">
              分類明細
            </h2>
            {categoryTotals.length === 0 ? (
              <p className="py-12 text-center text-sm text-zinc-400">
                {view === "month" ? "本月尚無支出資料" : "本年尚無支出資料"}
              </p>
            ) : (
              <div className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-zinc-900">
                {categoryTotals.map(({ category, amount }, idx) => (
                  <div
                    key={category}
                    className={`flex items-center gap-3 px-4 py-3 ${
                      idx !== categoryTotals.length - 1
                        ? "border-b border-zinc-100 dark:border-zinc-800"
                        : ""
                    }`}
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-base dark:bg-zinc-800">
                      {getCategoryIcon(category, "expense")}
                    </span>
                    <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-zinc-800 dark:text-zinc-100">
                          {category}
                        </span>
                        <span className="font-semibold text-zinc-700 dark:text-zinc-200">
                          {formatCurrency(amount)}
                        </span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                        <div
                          className="h-full rounded-full bg-zinc-700 dark:bg-zinc-400"
                          style={{
                            width: `${
                              maxCategoryAmount ? (amount / maxCategoryAmount) * 100 : 0
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
