import { API_BASE_URL } from "@/src/config/api";
import { parseChatApiResponse } from "@/src/features/chat/api/parseChatApiResponse";
import { resolveMediaUrl } from "@/src/features/profile/utils/resolveMediaUrl";
import { authFetch } from "@/src/lib/auth";

type GetMyChatRoomsResponse = {
  data?:
    | {
        rooms?: Array<{
          roomId?: string | number;
          id?: string | number;
          owner?: boolean;
          isOwner?: boolean;
          joined?: boolean;
          title?: string;
          thumbnailImageObjectKey?: string | null;
          thumbnailUrl?: string | null;
          thumbnailImageUrl?: string | null;
          participantCount?: number;
          memberCount?: number;
          currentMemberCount?: number;
          unreadMessageCount?: number;
          unreadCount?: number;
        }>;
      }
    | Array<{
        roomId?: string | number;
        id?: string | number;
        owner?: boolean;
        isOwner?: boolean;
        joined?: boolean;
        title?: string;
        thumbnailImageObjectKey?: string | null;
        thumbnailUrl?: string | null;
        thumbnailImageUrl?: string | null;
        participantCount?: number;
        memberCount?: number;
        currentMemberCount?: number;
        unreadMessageCount?: number;
        unreadCount?: number;
      }>;
  rooms?: Array<{
    roomId?: string | number;
    id?: string | number;
    owner?: boolean;
    isOwner?: boolean;
    joined?: boolean;
    title?: string;
    thumbnailImageObjectKey?: string | null;
    thumbnailUrl?: string | null;
    thumbnailImageUrl?: string | null;
    participantCount?: number;
    memberCount?: number;
    currentMemberCount?: number;
    unreadMessageCount?: number;
    unreadCount?: number;
  }>;
  message?: string;
};

export type MyChatRoom = {
  id: string;
  title: string;
  memberCount: number;
  thumbnailImageUrl: string | null;
  thumbnailImageObjectKey?: string | null;
  isOwner?: boolean;
  joined?: boolean;
  unreadCount?: number;
};

export async function getMyChatRooms() {
  const res = await authFetch(`${API_BASE_URL}/api/chat/rooms`, {
    method: "GET",
  });

  const raw = await res.text();
  const parsed = parseChatApiResponse<GetMyChatRoomsResponse>(raw);

  if (process.env.NODE_ENV !== "production") {
    console.log("[getMyChatRooms] raw response", raw);
    console.log("[getMyChatRooms] parsed response", parsed);
  }

  if (!res.ok) {
    const fallbackMessage =
      raw.trim() || "내 채팅방 목록을 불러오지 못했습니다.";
    const message = parsed?.message ?? fallbackMessage;

    throw new Error(`(${res.status}) ${message}`);
  }

  const rooms = Array.isArray(parsed?.rooms)
    ? parsed.rooms
    : Array.isArray(parsed?.data)
      ? parsed.data
      : Array.isArray(parsed?.data?.rooms)
        ? parsed.data.rooms
        : [];

  return {
    rooms: rooms.map((room) => ({
      id: String(room.roomId ?? room.id ?? ""),
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
      isOwner: room.owner ?? room.isOwner,
      joined: room.joined,
      unreadCount: room.unreadMessageCount ?? room.unreadCount,
    })),
  };
}
