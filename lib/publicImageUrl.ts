const bucket = process.env.EXPO_PUBLIC_STORAGE_BUCKET ?? "product-images";

/** Resolve product image_url to a fetchable URL (full URL or storage object path). */
export function publicImageUrl(imageUrl: string | null | undefined): string | null {
  if (!imageUrl) return null;
  const trimmed = imageUrl.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;

  const base = process.env.EXPO_PUBLIC_SUPABASE_URL?.replace(/\/$/, "") ?? "";
  if (!base) return null;
  const path = trimmed.replace(/^\/+/, "");
  return `${base}/storage/v1/object/public/${bucket}/${path}`;
}
