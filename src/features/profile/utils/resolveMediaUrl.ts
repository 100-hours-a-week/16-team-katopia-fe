import { IMAGE_BASE_URL } from "@/src/config/api";

export function resolveMediaUrl(url?: string | null) {
  if (!url) return null;
  if (/^https?:\/\//i.test(url) || url.startsWith("data:")) return url;
  const base = IMAGE_BASE_URL.replace(/\/$/, "");
  const key = url.startsWith("/") ? url.slice(1) : url;
  return `${base}/${key}`;
}
