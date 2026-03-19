export function parseChatApiResponse<T>(raw: string) {
  if (!raw) return null;

  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}
