export type ImageUrlValue =
  | string
  | {
      imageUrl?: string | null;
      accessUrl?: string | null;
      url?: string | null;
    };

export function pickImageUrl(value: ImageUrlValue | null | undefined) {
  if (!value) return null;
  if (typeof value === "string") return value;
  return value.accessUrl ?? value.imageUrl ?? value.url ?? null;
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
