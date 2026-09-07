import { put } from "@vercel/blob";

const EXTENSION_BY_TYPE: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

/**
 * Google profile photo URLs get rate-limited (HTTP 429) when hotlinked
 * from a browser <img> tag, even though a plain server-side fetch
 * succeeds. Mirror the image into our own Blob storage instead.
 */
export async function mirrorAvatarToBlob(sourceUrl: string, key: string): Promise<string | null> {
  try {
    const res = await fetch(sourceUrl);
    if (!res.ok) return null;

    const contentType = res.headers.get("content-type")?.split(";")[0] ?? "";
    const extension = EXTENSION_BY_TYPE[contentType] ?? "jpg";
    const buffer = Buffer.from(await res.arrayBuffer());

    const blob = await put(`avatars/oauth-${key}-${Date.now()}.${extension}`, buffer, {
      access: "public",
      addRandomSuffix: false,
      contentType: contentType || "image/jpeg",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    return blob.url;
  } catch (error) {
    console.error("Failed to mirror OAuth avatar:", error);
    return null;
  }
}
