const CHAT_READ_OVERRIDE_STORAGE_KEY = "chat.readOverrides";
const CHAT_READ_OVERRIDE_TTL_MS = 15_000;

type ChatReadOverrideMap = Record<string, number>;

function readOverrides(): ChatReadOverrideMap {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.sessionStorage.getItem(CHAT_READ_OVERRIDE_STORAGE_KEY);
    if (!raw) return {};

    const parsed = JSON.parse(raw) as ChatReadOverrideMap;
    if (!parsed || typeof parsed !== "object") return {};
    return parsed;
  } catch {
    return {};
  }
}

function writeOverrides(overrides: ChatReadOverrideMap) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(
    CHAT_READ_OVERRIDE_STORAGE_KEY,
    JSON.stringify(overrides),
  );
}

export function markChatRoomReadOverride(roomId: string) {
  const overrides = readOverrides();
  overrides[String(roomId)] = Date.now() + CHAT_READ_OVERRIDE_TTL_MS;
  writeOverrides(overrides);
}

export function getChatRoomReadOverride(roomId: string) {
  const overrides = readOverrides();
  const expiresAt = overrides[String(roomId)];

  if (!expiresAt) return false;
  if (expiresAt < Date.now()) {
    delete overrides[String(roomId)];
    writeOverrides(overrides);
    return false;
  }

  return true;
}

export function clearChatRoomReadOverride(roomId: string) {
  const overrides = readOverrides();
  if (!(String(roomId) in overrides)) return;

  delete overrides[String(roomId)];
  writeOverrides(overrides);
}
