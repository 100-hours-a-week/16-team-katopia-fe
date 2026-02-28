import { IMAGE_BASE_URL } from "@/src/config/api";

function normalizeHttps(url: string) {
  if (process.env.NODE_ENV !== "production") return url;
  return url.replace(/^http:\/\//i, "https://");
}

export function resolveMediaUrl(url?: string | null) {
  if (!url) return null;
  if (/^https?:\/\//i.test(url) || url.startsWith("data:")) {
    return normalizeHttps(url);
  }
  const base = normalizeHttps(IMAGE_BASE_URL).replace(/\/$/, "");
  const key = url.startsWith("/") ? url.slice(1) : url;
  return `${base}/${key}`;
}
