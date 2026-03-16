import { API_BASE_URL } from "@/src/config/api";
import { parseChatApiResponse } from "@/src/features/chat/api/parseChatApiResponse";
import { resolveMediaUrl } from "@/src/features/profile/utils/resolveMediaUrl";
import { authFetch } from "@/src/lib/auth";

type GetOpenChatRoomsResponse = {
  data?: {
    rooms?: Array<{
      roomId?: string | number;
      isOwner?: boolean;
      title?: string;
      thumbnailImageObjectKey?: string | null;
      thumbnailImageUrl?: string | null;
      thumbnailUrl?: string | null;
      participantCount?: number;
      memberCount?: number;
      currentMemberCount?: number;
      joined?: boolean;
      createdAt?: string;
      updatedAt?: string;
    }>;
    nextCursor?: string | null;
  };
  message?: string;
};

export type OpenChatRoom = {
  id: string;
  title: string;
  memberCount: number;
  thumbnailImageUrl: string | null;
  thumbnailImageObjectKey?: string | null;
  isOwner?: boolean;
  joined: boolean;
};

export async function getOpenChatRooms() {
  const res = await authFetch(`${API_BASE_URL}/api/chat/rooms/all`, {
    method: "GET",
  });

  const raw = await res.text();
  const parsed = parseChatApiResponse<GetOpenChatRoomsResponse>(raw);

  if (!res.ok) {
    const fallbackMessage =
      raw.trim() || "오픈 채팅방 목록을 불러오지 못했습니다.";
    const message = parsed?.message ?? fallbackMessage;
    console.error("[getOpenChatRooms] request failed", {
      status: res.status,
      body: raw.slice(0, 500),
    });
    throw new Error(`(${res.status}) ${message}`);
  }

  const rooms = Array.isArray(parsed?.data?.rooms) ? parsed.data.rooms : [];

  return {
    rooms: rooms.map((room) => ({
      id: String(room.roomId ?? ""),
      title: room.title?.trim() || "이름 없는 채팅방",
      memberCount:
        room.participantCount ??
        room.memberCount ??
        room.currentMemberCount ??
        0,
      thumbnailImageObjectKey: room.thumbnailImageObjectKey ?? null,
      thumbnailImageUrl: resolveMediaUrl(
        room.thumbnailImageObjectKey ??
          room.thumbnailImageUrl ??
          room.thumbnailUrl,
      ),
      isOwner: room.isOwner,
      joined: Boolean(room.joined),
    })),
    nextCursor: parsed?.data?.nextCursor ?? null,
  };
}
