"use client";

import { useChatSocketConnection } from "@/src/features/chat/hooks/useChatSocketConnection";

export function useChatSocket(enabled = true) {
  return useChatSocketConnection({ enabled });
}
