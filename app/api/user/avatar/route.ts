import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getSession } from "@/lib/session";
import User from "@/models/User";

const MAX_DATA_URL_LENGTH = 2_000_000;
const DATA_URL_PATTERN = /^data:image\/(png|jpe?g|webp);base64,/;

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "請先登入" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const image = body?.image;

  if (typeof image !== "string" || !DATA_URL_PATTERN.test(image)) {
    return NextResponse.json({ error: "圖片格式不正確" }, { status: 400 });
  }
  if (image.length > MAX_DATA_URL_LENGTH) {
    return NextResponse.json({ error: "圖片檔案過大，請選擇較小的圖片" }, { status: 400 });
  }

  try {
    await connectToDatabase();
    const user = await User.findByIdAndUpdate(
      session.sub,
      { avatarUrl: image },
      { new: true }
    ).select("avatarUrl");

    if (!user) {
      return NextResponse.json({ error: "找不到使用者" }, { status: 404 });
    }

    return NextResponse.json({ avatarUrl: user.avatarUrl });
  } catch (error) {
    console.error("Failed to update avatar:", error);
    return NextResponse.json({ error: "上傳失敗，請稍後再試" }, { status: 500 });
  }
}
