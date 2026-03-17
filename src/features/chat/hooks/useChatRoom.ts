"use client";

import { useEffect, useState } from "react";

import { getMyChatRooms } from "@/src/features/chat/api/getMyChatRooms";

type Params = {
  roomId: string;
  initialTitle?: string;
  initialMemberCount?: string;
  initialThumbnail?: string;
  initialThumbnailObjectKey?: string;
  initialIsOwner?: string;
};

export function useChatRoom({
  roomId,
  initialTitle,
  initialMemberCount,
  initialThumbnail,
  initialThumbnailObjectKey,
  initialIsOwner,
}: Params) {
  const [roomTitle, setRoomTitle] = useState(
    initialTitle?.trim() || "패션에 고민있는 사람 모여라!!!!!",
  );
  const [roomThumbnailSrc, setRoomThumbnailSrc] = useState(
    initialThumbnail?.trim() || "/images/chat_default.png",
  );
  const [roomThumbnailObjectKey, setRoomThumbnailObjectKey] = useState(
    initialThumbnailObjectKey?.trim() || "",
  );
  const [roomMemberCount, setRoomMemberCount] = useState(
    Number(initialMemberCount) > 0 ? Number(initialMemberCount) : 15,
  );
  const [resolvedIsOwner, setResolvedIsOwner] = useState(
    initialIsOwner === "1",
  );

  useEffect(() => {
    let cancelled = false;

    const loadRoomSummary = async () => {
      try {
        const response = await getMyChatRooms();
        if (cancelled) return;

        const currentRoom = response.rooms.find(
          (room) => String(room.id) === String(roomId),
        );
        if (!currentRoom) return;

        setResolvedIsOwner(Boolean(currentRoom.isOwner));
        setRoomTitle(currentRoom.title);
        setRoomMemberCount(currentRoom.memberCount);

        if (currentRoom.thumbnailImageObjectKey) {
          setRoomThumbnailObjectKey(currentRoom.thumbnailImageObjectKey);
        }

        if (currentRoom.thumbnailImageUrl) {
          setRoomThumbnailSrc(currentRoom.thumbnailImageUrl);
        }
      } catch {
        // ignore
      }
    };

    void loadRoomSummary();

    return () => {
      cancelled = true;
    };
  }, [roomId]);

  return {
    roomTitle,
    setRoomTitle,
    roomThumbnailSrc,
    setRoomThumbnailSrc,
    roomThumbnailObjectKey,
    setRoomThumbnailObjectKey,
    roomMemberCount,
    setRoomMemberCount,
    resolvedIsOwner,
    setResolvedIsOwner,
  };
}
