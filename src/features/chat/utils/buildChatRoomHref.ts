import type { ChatRoom } from "@/src/features/chat/types";

export function buildChatRoomHref(
  room: Pick<
    ChatRoom,
    | "id"
    | "title"
    | "memberCount"
    | "thumbnailImageUrl"
    | "thumbnailImageObjectKey"
    | "isOwner"
    | "category"
    | "joined"
  >,
) {
  const searchParams = new URLSearchParams({
    title: room.title,
    memberCount: String(room.memberCount),
  });

  if (room.thumbnailImageUrl) {
    searchParams.set("thumbnail", room.thumbnailImageUrl);
  }
  if (room.thumbnailImageObjectKey) {
    searchParams.set("thumbnailObjectKey", room.thumbnailImageObjectKey);
  }

  if (room.isOwner === true) {
    searchParams.set("isOwner", "1");
  }

  return `/chat/${room.id}?${searchParams.toString()}`;
}
