import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getSession } from "@/lib/session";
import Expense from "@/models/Expense";

export async function DELETE(_request: Request, ctx: RouteContext<"/api/expenses/[id]">) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "請先登入" }, { status: 401 });
  }

  const { id } = await ctx.params;

  try {
    await connectToDatabase();

    const expense = await Expense.findOneAndDelete({ _id: id, userId: session.sub });
    if (!expense) {
      return NextResponse.json({ error: "找不到該筆紀錄" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete expense:", error);
    return NextResponse.json({ error: "刪除失敗" }, { status: 500 });
  }
}
