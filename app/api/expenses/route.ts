import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { analyzeExpenseText } from "@/lib/gemini";
import { getSession } from "@/lib/session";
import Expense from "@/models/Expense";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "請先登入" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const text = body?.text;

  if (typeof text !== "string" || !text.trim()) {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }

  try {
    const analyzed = await analyzeExpenseText(text);

    await connectToDatabase();
    const expense = await Expense.create({
      userId: session.sub,
      rawText: text,
      type: analyzed.type,
      amount: analyzed.amount,
      category: analyzed.category,
      description: analyzed.description ?? "",
      date: new Date(analyzed.date),
    });

    return NextResponse.json({ expense }, { status: 201 });
  } catch (error) {
    console.error("Failed to analyze/store expense:", error);
    return NextResponse.json({ error: "Failed to analyze or store expense" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "請先登入" }, { status: 401 });
  }

  const month = request.nextUrl.searchParams.get("month"); // "YYYY-MM"
  const date = request.nextUrl.searchParams.get("date"); // "YYYY-MM-DD"
  const year = request.nextUrl.searchParams.get("year"); // "YYYY"

  try {
    await connectToDatabase();

    const filter: Record<string, unknown> = { userId: session.sub };

    if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      const [y, mon, day] = date.split("-").map(Number);
      const start = new Date(Date.UTC(y, mon - 1, day));
      const end = new Date(Date.UTC(y, mon - 1, day + 1));
      filter.date = { $gte: start, $lt: end };
    } else if (month && /^\d{4}-\d{2}$/.test(month)) {
      const [y, mon] = month.split("-").map(Number);
      const start = new Date(Date.UTC(y, mon - 1, 1));
      const end = new Date(Date.UTC(y, mon, 1));
      filter.date = { $gte: start, $lt: end };
    } else if (year && /^\d{4}$/.test(year)) {
      const y = Number(year);
      const start = new Date(Date.UTC(y, 0, 1));
      const end = new Date(Date.UTC(y + 1, 0, 1));
      filter.date = { $gte: start, $lt: end };
    }

    const expenses = await Expense.find(filter).sort({ date: -1, createdAt: -1 });

    return NextResponse.json({ expenses });
  } catch (error) {
    console.error("Failed to fetch expenses:", error);
    return NextResponse.json({ error: "Failed to fetch expenses" }, { status: 500 });
  }
}
