const UPLOADABLE_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

// Some browsers/OSes report nonstandard or missing MIME types for camera photos
// (e.g. "image/jpg" instead of "image/jpeg", or "" for HEIC on some Android builds).
// Re-encode anything that isn't already an accepted type via canvas so the upload
// always matches what the server accepts.
export async function normalizeImageFile(file: File): Promise<File> {
  if (UPLOADABLE_TYPES.has(file.type)) {
    return file;
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error("不支援此圖片格式，請改用 JPG、PNG 或 WebP 圖片（iPhone 可於相機設定選擇「最相容」格式）");
  }

  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("圖片處理失敗，請稍後再試");
  }
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
  if (!blob) {
    throw new Error("圖片處理失敗，請稍後再試");
  }

  return new File([blob], "avatar.jpg", { type: "image/jpeg" });
}
