"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import type { DragEvent } from "react";

import { createChatRoom } from "@/src/features/chat/api/createChatRoom";
import { getMyChatRooms } from "@/src/features/chat/api/getMyChatRooms";
import { getOpenChatRooms } from "@/src/features/chat/api/getOpenChatRooms";
import { joinChatRoom } from "@/src/features/chat/api/joinChatRoom";
import ChatActionModal from "@/src/features/chat/components/ChatActionModal";
import ChatPageToolbar from "@/src/features/chat/components/ChatPageToolbar";
import ChatRoomCard from "@/src/features/chat/components/ChatRoomCard";
import CreateChatRoomModal from "@/src/features/chat/components/CreateChatRoomModal";
import {
  DEFAULT_CHAT_ROOM_IMAGES,
  DEFAULT_CHAT_ROOM_THUMBNAIL_OBJECT_KEY,
} from "@/src/features/chat/constants";
import type { ChatRoom, ChatTab } from "@/src/features/chat/types";
import {
  clearChatRoomReadOverride,
  getChatRoomReadOverride,
} from "@/src/features/chat/utils/chatReadOverride";
import { buildChatRoomHref } from "@/src/features/chat/utils/buildChatRoomHref";
import {
  requestUploadPresign,
  uploadToPresignedUrl,
} from "@/src/features/upload/api/presignUpload";

const INITIAL_CHAT_ROOMS: ChatRoom[] = [];
const MINE_CHAT_ROOM_ORDER_STORAGE_KEY = "chat:mine-room-order";

function readMineRoomOrder() {
  if (typeof window === "undefined") return [];

  try {
    const stored = window.localStorage.getItem(MINE_CHAT_ROOM_ORDER_STORAGE_KEY);
    if (!stored) return [];

    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed.map((value) => String(value)) : [];
  } catch {
    return [];
  }
}

function writeMineRoomOrder(roomIds: string[]) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(
      MINE_CHAT_ROOM_ORDER_STORAGE_KEY,
      JSON.stringify(roomIds),
    );
  } catch {
    // ignore
  }
}

function applyMineRoomOrder(mineRooms: ChatRoom[]) {
  const order = readMineRoomOrder();
  if (order.length === 0) return mineRooms;

  const roomMap = new Map(mineRooms.map((room) => [String(room.id), room]));
  const orderedRooms = order
    .map((roomId) => roomMap.get(roomId))
    .filter((room): room is ChatRoom => Boolean(room));
  const remainingRooms = mineRooms.filter(
    (room) => !order.includes(String(room.id)),
  );

  return [...orderedRooms, ...remainingRooms];
}

function reorderMineRooms(
  mineRooms: ChatRoom[],
  sourceRoomId: string,
  targetRoomId: string,
) {
  if (sourceRoomId === targetRoomId) return mineRooms;

  const sourceIndex = mineRooms.findIndex(
    (room) => String(room.id) === String(sourceRoomId),
  );
  const targetIndex = mineRooms.findIndex(
    (room) => String(room.id) === String(targetRoomId),
  );

  if (sourceIndex < 0 || targetIndex < 0) return mineRooms;

  const nextRooms = [...mineRooms];
  const [movedRoom] = nextRooms.splice(sourceIndex, 1);
  nextRooms.splice(targetIndex, 0, movedRoom);
  return nextRooms;
}

export default function ChatPage() {
  const router = useRouter();
  const createImageInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<ChatTab>("mine");
  const [searchQuery, setSearchQuery] = useState("");
  const [rooms, setRooms] = useState(INITIAL_CHAT_ROOMS);
  const [createOpen, setCreateOpen] = useState(false);
  const [newRoomTitle, setNewRoomTitle] = useState("");
  const [newRoomThumbnailPreview, setNewRoomThumbnailPreview] = useState<
    string | null
  >(null);
  const [newRoomThumbnailFile, setNewRoomThumbnailFile] = useState<File | null>(
    null,
  );
  const [selectedDefaultThumbnail, setSelectedDefaultThumbnail] = useState<
    string | null
  >(null);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [isJoiningRoom, setIsJoiningRoom] = useState(false);
  const [isLoadingMineRooms, setIsLoadingMineRooms] = useState(true);
  const [mineRoomsError, setMineRoomsError] = useState<string | null>(null);
  const [isLoadingOpenRooms, setIsLoadingOpenRooms] = useState(true);
  const [openRoomsError, setOpenRoomsError] = useState<string | null>(null);
  const [pendingJoinRoom, setPendingJoinRoom] = useState<ChatRoom | null>(null);
  const [draggingMineRoomId, setDraggingMineRoomId] = useState<string | null>(
    null,
  );
  const [dragOverMineRoomId, setDragOverMineRoomId] = useState<string | null>(
    null,
  );

  const loadMineRooms = useEffectEvent(async (signal?: { cancelled: boolean }) => {
    try {
      setIsLoadingMineRooms(true);
      setMineRoomsError(null);
      const response = await getMyChatRooms();
      if (signal?.cancelled) return;

      setRooms((prev) => {
        const openRooms = prev.filter((room) => room.category === "open");
        const mineRooms = response.rooms.map((room) => {
          const hasReadOverride = getChatRoomReadOverride(room.id);
          const unreadCount =
            room.unreadCount === 0
              ? (clearChatRoomReadOverride(room.id), 0)
              : hasReadOverride
                ? 0
                : room.unreadCount;

          return {
            id: room.id,
            title: room.title,
            memberCount: room.memberCount,
            thumbnailImageUrl: room.thumbnailImageUrl,
            thumbnailImageObjectKey: room.thumbnailImageObjectKey ?? undefined,
            unreadCount,
            isOwner: room.isOwner,
            joined: room.joined,
            category: "mine" as const,
          };
        });

        const orderedMineRooms = applyMineRoomOrder(mineRooms);
        writeMineRoomOrder(orderedMineRooms.map((room) => String(room.id)));

        return [...orderedMineRooms, ...openRooms];
      });
    } catch (error) {
      if (signal?.cancelled) return;
      setMineRoomsError(
        error instanceof Error
          ? error.message
          : "내 채팅방 목록을 불러오지 못했습니다.",
      );
    } finally {
      if (!signal?.cancelled) {
        setIsLoadingMineRooms(false);
      }
    }
  });

  useEffect(() => {
    return () => {
      if (
        newRoomThumbnailPreview &&
        newRoomThumbnailPreview.startsWith("blob:")
      ) {
        URL.revokeObjectURL(newRoomThumbnailPreview);
      }
    };
  }, [newRoomThumbnailPreview]);

  useEffect(() => {
    let cancelled = false;
    void loadMineRooms({ cancelled });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === "hidden") return;
      void loadMineRooms();
    };

    window.addEventListener("focus", handleVisibilityOrFocus);
    window.addEventListener("pageshow", handleVisibilityOrFocus);
    document.addEventListener("visibilitychange", handleVisibilityOrFocus);

    return () => {
      window.removeEventListener("focus", handleVisibilityOrFocus);
      window.removeEventListener("pageshow", handleVisibilityOrFocus);
      document.removeEventListener("visibilitychange", handleVisibilityOrFocus);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadOpenRooms = async () => {
      try {
        setIsLoadingOpenRooms(true);
        setOpenRoomsError(null);
        const response = await getOpenChatRooms();
        if (cancelled) return;

        setRooms((prev) => {
          const mineRooms = prev.filter((room) => room.category === "mine");
          const openRooms = response.rooms.map((room) => ({
            id: room.id,
            title: room.title,
            memberCount: room.memberCount,
            thumbnailImageUrl: room.thumbnailImageUrl,
            thumbnailImageObjectKey: room.thumbnailImageObjectKey,
            isOwner: room.isOwner,
            joined: room.joined,
            category: "open" as const,
          }));

          return [...mineRooms, ...openRooms];
        });
      } catch (error) {
        if (cancelled) return;
        setOpenRoomsError(
          error instanceof Error
            ? error.message
            : "오픈 채팅방 목록을 불러오지 못했습니다.",
        );
      } finally {
        if (!cancelled) {
          setIsLoadingOpenRooms(false);
        }
      }
    };

    void loadOpenRooms();

    return () => {
      cancelled = true;
    };
  }, []);

  const joinedRoomIds = useMemo(
    () =>
      new Set(
        rooms
          .filter((room) => room.category === "mine")
          .map((room) => String(room.id)),
      ),
    [rooms],
  );

  const filteredRooms = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    return rooms.filter((room) => {
      if (room.category !== activeTab) return false;
      if (
        activeTab === "open" &&
        (room.joined === true || joinedRoomIds.has(String(room.id)))
      ) {
        return false;
      }
      if (!normalizedQuery) return true;
      return room.title.toLowerCase().includes(normalizedQuery);
    });
  }, [activeTab, joinedRoomIds, rooms, searchQuery]);

  const mineRoomDragOffsetById = useMemo(() => {
    if (!draggingMineRoomId || !dragOverMineRoomId) {
      return {} as Record<string, string>;
    }

    const mineRooms = rooms.filter((room) => room.category === "mine");
    const sourceIndex = mineRooms.findIndex(
      (room) => String(room.id) === draggingMineRoomId,
    );
    const targetIndex = mineRooms.findIndex(
      (room) => String(room.id) === dragOverMineRoomId,
    );

    if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) {
      return {} as Record<string, string>;
    }

    const offsets: Record<string, string> = {};

    if (sourceIndex < targetIndex) {
      for (let index = sourceIndex + 1; index <= targetIndex; index += 1) {
        offsets[String(mineRooms[index].id)] = "-translate-y-3";
      }
    } else {
      for (let index = targetIndex; index < sourceIndex; index += 1) {
        offsets[String(mineRooms[index].id)] = "translate-y-3";
      }
    }

    return offsets;
  }, [dragOverMineRoomId, draggingMineRoomId, rooms]);

  const resetCreateRoomDraft = () => {
    if (newRoomThumbnailPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(newRoomThumbnailPreview);
    }
    setNewRoomTitle("");
    setNewRoomThumbnailPreview(null);
    setNewRoomThumbnailFile(null);
    setSelectedDefaultThumbnail(null);
  };

  const handleCreateRoom = async () => {
    const trimmedTitle = newRoomTitle.trim();
    if (!trimmedTitle || isCreatingRoom || !newRoomThumbnailPreview) return;

    try {
      setIsCreatingRoom(true);
      let thumbnailImageObjectKey = DEFAULT_CHAT_ROOM_THUMBNAIL_OBJECT_KEY;

      if (newRoomThumbnailFile) {
        const extension =
          newRoomThumbnailFile.name.split(".").pop()?.toLowerCase() || "png";
        const [presigned] = await requestUploadPresign("POST", [extension]);
        await uploadToPresignedUrl(
          presigned.uploadUrl,
          newRoomThumbnailFile,
          newRoomThumbnailFile.type || undefined,
        );
        thumbnailImageObjectKey = presigned.imageObjectKey.replace(/^\/+/, "");
      } else if (selectedDefaultThumbnail) {
        const imageResponse = await fetch(selectedDefaultThumbnail);
        if (!imageResponse.ok) {
          throw new Error("기본 이미지를 불러오지 못했습니다.");
        }

        const imageBlob = await imageResponse.blob();
        const extension =
          selectedDefaultThumbnail.split(".").pop()?.toLowerCase() || "png";
        const [presigned] = await requestUploadPresign("POST", [extension]);
        await uploadToPresignedUrl(
          presigned.uploadUrl,
          imageBlob,
          imageBlob.type || `image/${extension}`,
        );
        thumbnailImageObjectKey = presigned.imageObjectKey.replace(/^\/+/, "");
      }

      const createdRoom = await createChatRoom({
        title: trimmedTitle,
        thumbnailImageObjectKey,
      });

      const nextCreatedRoom: ChatRoom = {
        id: String(createdRoom.id ?? `mine-${Date.now()}`),
        title: createdRoom.title,
        memberCount: createdRoom.memberCount,
        thumbnailImageUrl:
          createdRoom.thumbnailImageUrl ?? newRoomThumbnailPreview,
        thumbnailImageObjectKey:
          createdRoom.thumbnailImageObjectKey ?? thumbnailImageObjectKey,
        isOwner: createdRoom.isOwner ?? true,
        category: "mine",
      };

      setRooms((prev) => {
        const mineRooms = [nextCreatedRoom, ...prev.filter((room) => room.category === "mine")];
        writeMineRoomOrder(mineRooms.map((room) => String(room.id)));
        return [...mineRooms, ...prev.filter((room) => room.category !== "mine")];
      });
      resetCreateRoomDraft();
      setCreateOpen(false);
      setActiveTab("mine");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "채팅방 생성 중 오류가 발생했습니다.";
      window.alert(message);
    } finally {
      setIsCreatingRoom(false);
    }
  };

  const handleCloseCreateModal = () => {
    if (isCreatingRoom) return;
    setCreateOpen(false);
    resetCreateRoomDraft();
  };

  const handleCreateImageUpload = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (
      newRoomThumbnailPreview &&
      newRoomThumbnailPreview.startsWith("blob:")
    ) {
      URL.revokeObjectURL(newRoomThumbnailPreview);
    }

    const objectUrl = URL.createObjectURL(file);
    setNewRoomThumbnailPreview(objectUrl);
    setNewRoomThumbnailFile(file);
    setSelectedDefaultThumbnail(null);
    event.target.value = "";
  };

  const handleJoinRoom = async () => {
    if (!pendingJoinRoom) return;

    try {
      setIsJoiningRoom(true);
      const joined = await joinChatRoom(String(pendingJoinRoom.id));
      const joinedRoom = {
        ...pendingJoinRoom,
        memberCount:
          joined.participantCount ??
          Math.max(pendingJoinRoom.memberCount + 1, 1),
        joined: joined.joined ?? true,
        category: "mine" as const,
        unreadCount: undefined,
      };

      setRooms((prev) => {
        const alreadyJoined = prev.some(
          (room) => room.id === pendingJoinRoom.id && room.category === "mine",
        );
        if (alreadyJoined) return prev;

        const mineRooms = applyMineRoomOrder([
          joinedRoom,
          ...prev.filter((room) => room.category === "mine"),
        ]);
        writeMineRoomOrder(mineRooms.map((room) => String(room.id)));
        return [...mineRooms, ...prev.filter((room) => room.category !== "mine")];
      });
      setPendingJoinRoom(null);
      setActiveTab("mine");
      router.push(buildChatRoomHref(joinedRoom));
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "채팅방 참여 중 오류가 발생했습니다.";
      window.alert(message);
    } finally {
      setIsJoiningRoom(false);
    }
  };

  const handleMineRoomDrop = (sourceRoomId: string, targetRoomId: string) => {
    setRooms((prev) => {
      const mineRooms = prev.filter((room) => room.category === "mine");
      const reorderedMineRooms = reorderMineRooms(
        mineRooms,
        sourceRoomId,
        targetRoomId,
      );

      writeMineRoomOrder(reorderedMineRooms.map((room) => String(room.id)));
      return [...reorderedMineRooms, ...prev.filter((room) => room.category !== "mine")];
    });
    setDraggingMineRoomId(null);
    setDragOverMineRoomId(null);
  };

  return (
    <div className="min-h-screen bg-white">
      <main className="px-6 pb-20 pt-10">
        <ChatPageToolbar
          activeTab={activeTab}
          searchQuery={searchQuery}
          onBack={() => router.back()}
          onCreate={() => setCreateOpen(true)}
          onSearchChange={setSearchQuery}
          onTabChange={setActiveTab}
        />

        <div
          className={
            activeTab === "open"
              ? "mt-11 grid grid-cols-2 gap-x-4 gap-y-8"
              : "mt-11 space-y-5"
          }
        >
          {activeTab === "mine" && isLoadingMineRooms && (
            <div className="rounded-[24px] border border-dashed border-[#cfcfcf] px-5 py-12 text-center text-[15px] text-[#8c8c8c]">
              내 채팅방을 불러오는 중입니다.
            </div>
          )}

          {activeTab === "mine" && mineRoomsError && !isLoadingMineRooms && (
            <div className="rounded-[24px] border border-dashed border-[#cfcfcf] px-5 py-12 text-center text-[15px] text-[#8c8c8c]">
              {mineRoomsError}
            </div>
          )}

          {activeTab === "open" && isLoadingOpenRooms && (
            <div className="col-span-2 rounded-[24px] border border-dashed border-[#cfcfcf] px-5 py-12 text-center text-[15px] text-[#8c8c8c]">
              오픈 채팅방을 불러오는 중입니다.
            </div>
          )}

          {activeTab === "open" && openRoomsError && !isLoadingOpenRooms && (
            <div className="col-span-2 rounded-[24px] border border-dashed border-[#cfcfcf] px-5 py-12 text-center text-[15px] text-[#8c8c8c]">
              {openRoomsError}
            </div>
          )}

          {!(
            (activeTab === "mine" && isLoadingMineRooms) ||
            (activeTab === "open" && isLoadingOpenRooms)
          ) &&
            filteredRooms.map((room) => (
              <ChatRoomCard
                key={room.id}
                room={room}
                draggable={activeTab === "mine"}
                isDragging={draggingMineRoomId === String(room.id)}
                isDropTarget={
                  activeTab === "mine" &&
                  dragOverMineRoomId === String(room.id) &&
                  draggingMineRoomId !== String(room.id)
                }
                dragOffsetClassName={
                  room.category === "mine"
                    ? mineRoomDragOffsetById[String(room.id)]
                    : undefined
                }
                onDragStart={(event: DragEvent<HTMLButtonElement>) => {
                  if (room.category !== "mine") return;
                  event.dataTransfer.effectAllowed = "move";
                  event.dataTransfer.setData("text/plain", String(room.id));
                  setDraggingMineRoomId(String(room.id));
                  setDragOverMineRoomId(String(room.id));
                }}
                onDragOver={(event: DragEvent<HTMLButtonElement>) => {
                  if (room.category !== "mine" || !draggingMineRoomId) return;
                  event.preventDefault();
                  event.dataTransfer.dropEffect = "move";
                  if (dragOverMineRoomId !== String(room.id)) {
                    setDragOverMineRoomId(String(room.id));
                  }
                }}
                onDrop={(event: DragEvent<HTMLButtonElement>) => {
                  if (room.category !== "mine" || !draggingMineRoomId) return;
                  event.preventDefault();
                  handleMineRoomDrop(draggingMineRoomId, String(room.id));
                }}
                onDragEnd={() => {
                  setDraggingMineRoomId(null);
                  setDragOverMineRoomId(null);
                }}
                onClick={() => {
                  if (room.category === "open") {
                    setPendingJoinRoom(room);
                    return;
                  }

                  setRooms((prev) =>
                    prev.map((item) =>
                      item.category === "mine" && item.id === room.id
                        ? { ...item, unreadCount: 0 }
                        : item,
                    ),
                  );
                  router.push(buildChatRoomHref(room));
                }}
              />
            ))}

          {activeTab === "mine" &&
            !isLoadingMineRooms &&
            !mineRoomsError &&
            filteredRooms.length === 0 && (
              <div className="rounded-[24px] border border-dashed border-[#cfcfcf] px-5 py-12 text-center text-[15px] text-[#8c8c8c]">
                조건에 맞는 채팅방이 없습니다.
              </div>
            )}

          {activeTab === "open" &&
            !isLoadingOpenRooms &&
            !openRoomsError &&
            filteredRooms.length === 0 && (
              <div className="col-span-2 flex flex-col items-center justify-center px-5 py-20 text-center">
                <Image src="/icons/sadface.svg" alt="" width={75} height={75} />
                <p className="mt-5 text-[14px] font-medium tracking-[-0.03em] text-[#7d7d7d]">
                  현재 남아있는 오픈채팅그룹방이 존재하지 않습니다.
                </p>
              </div>
            )}
        </div>
      </main>

      <CreateChatRoomModal
        open={createOpen}
        title={newRoomTitle}
        thumbnailPreview={newRoomThumbnailPreview}
        defaultImages={DEFAULT_CHAT_ROOM_IMAGES}
        isSubmitting={isCreatingRoom}
        onTitleChange={setNewRoomTitle}
        onUploadClick={() => createImageInputRef.current?.click()}
        onSelectDefaultImage={(image) => {
          if (
            newRoomThumbnailPreview &&
            newRoomThumbnailPreview.startsWith("blob:")
          ) {
            URL.revokeObjectURL(newRoomThumbnailPreview);
          }
          setNewRoomThumbnailPreview(image);
          setNewRoomThumbnailFile(null);
          setSelectedDefaultThumbnail(image);
        }}
        onClose={handleCloseCreateModal}
        onConfirm={handleCreateRoom}
      />
      <input
        ref={createImageInputRef}
        type="file"
        accept="image/*"
        onChange={handleCreateImageUpload}
        className="hidden"
      />

      <ChatActionModal
        open={Boolean(pendingJoinRoom)}
        title={`“ ${pendingJoinRoom?.title ?? ""} ”\n현재 채팅방에 참여하시겠습니까?`}
        onCancel={() => {
          if (isJoiningRoom) return;
          setPendingJoinRoom(null);
        }}
        onConfirm={handleJoinRoom}
        confirmLabel={isJoiningRoom ? "참여 중..." : "참여하기"}
        confirmDisabled={isJoiningRoom}
      >
        <div className="rounded-[20px] bg-[#f8f8f8] px-5 py-4">
          <p className="text-[15px] leading-6 text-[#444444]">
            새로운 오픈 그룹채팅에 참여하면 내 그룹채팅 목록에서도 바로 확인할
            수 있습니다.
          </p>
        </div>
      </ChatActionModal>
    </div>
  );
}
