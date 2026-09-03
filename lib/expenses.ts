export interface ExpenseItem {
  _id: string;
  userId: string;
  rawText: string;
  type: "expense" | "income";
  amount: number;
  category: string;
  description: string;
  date: string;
  createdAt: string;
}

const CATEGORY_ICONS: Record<string, string> = {
  餐飲: "🍔",
  交通: "🚗",
  購物: "🛍️",
  娛樂: "🎮",
  居住: "🏠",
  水電: "💡",
  醫療: "💊",
  教育: "📚",
  薪資: "💰",
  獎金: "🎁",
  其他: "📦",
};

export function getCategoryIcon(category: string, type: "expense" | "income") {
  return CATEGORY_ICONS[category] ?? (type === "income" ? "💰" : "📦");
}

export function formatCurrency(amount: number) {
  return `NT$ ${amount.toLocaleString("zh-TW")}`;
}

export function toDateKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function formatMonth(date: Date) {
  return `${date.getFullYear()} 年 ${date.getMonth() + 1} 月`;
}

export function formatMonthParam(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export const WEEKDAY_LABELS = ["日", "一", "二", "三", "四", "五", "六"];

export function getDaysInMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

export function formatYear(date: Date) {
  return `${date.getFullYear()} 年`;
}

export function formatYearParam(date: Date) {
  return `${date.getFullYear()}`;
}

export function computeMonthlyTotals(expenses: ExpenseItem[]) {
  const totals = Array.from({ length: 12 }, (_, i) => ({ month: i + 1, amount: 0 }));
  for (const item of expenses) {
    if (item.type !== "expense") continue;
    const monthIndex = new Date(item.date).getMonth();
    totals[monthIndex].amount += item.amount;
  }
  return totals;
}

export function formatDayLabel(date: Date) {
  const dateKey = toDateKey(date);
  const today = toDateKey(new Date());
  const yesterday = toDateKey(new Date(Date.now() - 24 * 60 * 60 * 1000));

  const weekday = new Intl.DateTimeFormat("zh-TW", { weekday: "short" }).format(date);
  const md = `${date.getMonth() + 1}/${date.getDate()}`;

  if (dateKey === today) return `今天・${md} (${weekday})`;
  if (dateKey === yesterday) return `昨天・${md} (${weekday})`;
  return `${md} (${weekday})`;
}

export function sumByType(expenses: ExpenseItem[], type: "expense" | "income") {
  return expenses
    .filter((item) => item.type === type)
    .reduce((sum, item) => sum + item.amount, 0);
}

export function computeCategoryTotals(expenses: ExpenseItem[]) {
  const map = new Map<string, number>();
  for (const item of expenses) {
    if (item.type !== "expense") continue;
    map.set(item.category, (map.get(item.category) ?? 0) + item.amount);
  }
  return Array.from(map.entries())
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);
}
