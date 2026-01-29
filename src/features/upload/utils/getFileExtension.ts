const MIME_EXTENSION_MAP: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/heic": "heic",
  "image/heif": "heif",
  "image/webp": "webp",
};

export function getFileExtension(file: File) {
  const nameParts = file.name.split(".");
  const byName = nameParts.length > 1 ? nameParts.pop()?.toLowerCase() : null;
  if (byName) return byName;

  const byType = file.type ? MIME_EXTENSION_MAP[file.type] : undefined;
  return byType ?? "";
}
