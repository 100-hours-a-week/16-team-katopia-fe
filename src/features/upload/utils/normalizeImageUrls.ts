import { resolveMediaUrl } from "@/src/features/profile/utils/resolveMediaUrl";

export type ImageUrlValue =
  | string
  | {
      imageObjectKey?: string | null;
      imageUrl?: string | null;
      accessUrl?: string | null;
      url?: string | null;
    };

export function pickImageUrl(value: ImageUrlValue | null | undefined) {
  if (!value) return null;
  if (typeof value === "string") return resolveMediaUrl(value);
  const raw =
    value.imageObjectKey ??
    value.accessUrl ??
    value.imageUrl ??
    value.url ??
    null;
  return raw ? resolveMediaUrl(raw) : null;
}

export function normalizeImageUrls(
  value: ImageUrlValue[] | ImageUrlValue | null | undefined,
) {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map(pickImageUrl).filter(Boolean) as string[];
  }
  const single = pickImageUrl(value);
  return single ? [single] : [];
}
