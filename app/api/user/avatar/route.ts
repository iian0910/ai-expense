import { NextRequest, NextResponse } from "next/server";
import { put, del } from "@vercel/blob";
import { connectToDatabase } from "@/lib/mongodb";
import { getSession } from "@/lib/session";
import User from "@/models/User";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "請先登入" }, { status: 401 });
  }

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "請選擇圖片檔案" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "僅支援 JPG、PNG、WebP 圖片" }, { status: 400 });
  }
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "圖片檔案過大，請選擇 5MB 以內的圖片" }, { status: 400 });
  }

  try {
    await connectToDatabase();

    const extension = file.type.split("/")[1];
    const blob = await put(`avatars/${session.sub}-${Date.now()}.${extension}`, file, {
      access: "public",
      addRandomSuffix: false,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    const previousUser = await User.findByIdAndUpdate(
      session.sub,
      { avatarUrl: blob.url },
      { returnDocument: "before" }
    ).select("avatarUrl");

    if (!previousUser) {
      return NextResponse.json({ error: "找不到使用者" }, { status: 404 });
    }

    const previousAvatarUrl = previousUser.avatarUrl as string | undefined;
    if (previousAvatarUrl && previousAvatarUrl.includes(".public.blob.vercel-storage.com")) {
      await del(previousAvatarUrl, { token: process.env.BLOB_READ_WRITE_TOKEN }).catch((err) => {
        console.error("Failed to delete previous avatar blob:", err);
      });
    }

    return NextResponse.json({ avatarUrl: blob.url });
  } catch (error) {
    console.error("Failed to upload avatar:", error);
    return NextResponse.json({ error: "上傳失敗，請稍後再試" }, { status: 500 });
  }
}
