"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { createChatRoom } from "@/src/features/chat/api/createChatRoom";
import { getOpenChatRooms } from "@/src/features/chat/api/getOpenChatRooms";
import { DEFAULT_CHAT_ROOM_THUMBNAIL_OBJECT_KEY } from "@/src/features/chat/constants";

type ChatTab = "mine" | "open";

type ChatRoom = {
  id: string;
  title: string;
  memberCount: number;
  thumbnailImageUrl?: string | null;
  joined?: boolean;
  unreadCount?: number;
  category: ChatTab;
};

function buildChatRoomHref(room: Pick<ChatRoom, "id" | "title" | "memberCount" | "thumbnailImageUrl">) {
  const searchParams = new URLSearchParams({
    title: room.title,
    memberCount: String(room.memberCount),
  });

  if (room.thumbnailImageUrl) {
    searchParams.set("thumbnail", room.thumbnailImageUrl);
  }

  return `/chat/${room.id}?${searchParams.toString()}`;
}

const INITIAL_CHAT_ROOMS: ChatRoom[] = [
  {
    id: "mine-1",
    title: "패션에 고민있는 분들 모여라!!!!",
    memberCount: 15,
    unreadCount: 20,
    category: "mine",
  },
  {
    id: "mine-2",
    title: "오늘 출근룩 같이 골라요",
    memberCount: 15,
    category: "mine",
  },
  {
    id: "mine-3",
    title: "주말 데이트룩 추천방",
    memberCount: 15,
    category: "mine",
  },
  {
    id: "open-1",
    title: "여름 셔츠 코디 같이 보실 분",
    memberCount: 28,
    category: "open",
  },
  {
    id: "open-2",
    title: "데님 좋아하는 사람들 모임",
    memberCount: 42,
    category: "open",
  },
  {
    id: "open-3",
    title: "OOTD 피드백 편하게 해요",
    memberCount: 31,
    category: "open",
  },
];

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-5 w-5 text-[#202020]"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
    >
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16l4 4" strokeLinecap="round" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-7 w-7"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v8M8 12h8" strokeLinecap="round" />
    </svg>
  );
}

function ChatRoomCard({
  room,
  onClick,
}: {
  room: ChatRoom;
  onClick?: () => void;
}) {
  const isMine = room.category === "mine";
  const isOpen = room.category === "open";

  return (
    <button
      type="button"
      onClick={onClick}
      className={
        isMine
          ? "relative w-full rounded-[30px] bg-[#f6f6f6] px-8 py-5 text-left transition-colors hover:bg-[#f0f0f0]"
          : isOpen
            ? "w-full bg-[#f3f3f3] px-6 pb-5 pt-5 text-center transition-colors hover:bg-[#ededed]"
            : "relative w-full transform-gpu rounded-[22px] border border-[#1a1a1a] bg-white px-5 py-4 text-left shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-[transform,box-shadow,background-color] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-[2px] hover:scale-[1.003] hover:bg-[#fcfcfc] hover:shadow-[0_10px_24px_rgba(0,0,0,0.08)] active:translate-y-0 active:scale-[0.998]"
      }
      style={
        isOpen
          ? {
              borderTopLeftRadius: "45px",
              borderBottomLeftRadius: "40px",
              borderTopRightRadius: "0px",
              borderBottomRightRadius: "45px",
            }
          : undefined
      }
    >
      {isOpen && (
        <div className="mx-auto flex w-fit items-center justify-center gap-3">
          <div className="relative h-[50px] w-[50px] overflow-hidden rounded-full bg-[#dddddd]">
            <Image
              src={room.thumbnailImageUrl || "/images/chat_default.png"}
              alt=""
              fill
              sizes="50px"
              className="object-cover"
            />
          </div>
          <div className="flex items-center gap-1.5 text-[13px] font-medium text-[#111111]">
            <Image src="/icons/user.svg" alt="" width={12} height={12} />
            <span className="leading-none">{room.memberCount}</span>
          </div>
        </div>
      )}
      <p
        className={
          isMine
            ? "pr-12 text-[15px] font-semibold leading-[1.3] tracking-[-0.03em] text-[#111111]"
            : isOpen
              ? "mt-6 text-[15px] font-semibold leading-[1.32] tracking-[-0.03em] text-[#111111]"
              : "pr-8 text-[14px] font-semibold leading-[1.35] text-[#111111]"
        }
      >
        {room.title}
      </p>
      {!isOpen && (
        <div
          className={
            isMine
              ? "mt-2.5 flex items-center gap-1.5 text-[15px] font-medium text-[#111111]"
              : "mt-3 flex items-center gap-1 text-[13px] font-medium text-[#1c1c1c]"
          }
        >
          <Image
            src="/icons/user.svg"
            alt=""
            width={isMine ? 16 : 13}
            height={isMine ? 16 : 13}
          />
          <span className="leading-none">{room.memberCount}</span>
        </div>
      )}
      {typeof room.unreadCount === "number" && room.unreadCount > 0 && (
        <span
          className={
            isMine
              ? "absolute right-5 top-4 flex h-6 min-w-6 items-center justify-center rounded-full bg-[#111111] px-1.5 text-[11px] font-semibold text-white"
              : "absolute right-4 top-1/2 flex h-6 min-w-6 -translate-y-1/2 items-center justify-center rounded-full bg-[#111111] px-1.5 text-[11px] font-semibold text-white"
          }
        >
          {room.unreadCount}
        </span>
      )}
    </button>
  );
}

function ChatActionModal({
  open,
  title,
  children,
  onCancel,
  onConfirm,
  confirmLabel,
  confirmDisabled = false,
}: {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onCancel: () => void;
  onConfirm: () => void;
  confirmLabel: string;
  confirmDisabled?: boolean;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-80 flex items-center justify-center bg-black/45 px-6">
      <div className="w-full max-w-[376px] bg-white px-6 py-7 shadow-[0_24px_80px_rgba(0,0,0,0.22)]">
        <p className="text-[20px] font-semibold whitespace-pre-line text-[#111111]">
          {title}
        </p>
        <div className="mt-5">{children}</div>
        <div className="mt-7 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="h-12 border border-[#191919] text-[17px] font-semibold text-[#111111]"
          >
            취소
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={confirmDisabled}
            className="h-12 bg-black text-[17px] font-semibold text-white disabled:bg-[#bdbdbd]"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ChatTab>("mine");
  const [searchQuery, setSearchQuery] = useState("");
  const [rooms, setRooms] = useState(INITIAL_CHAT_ROOMS);
  const [createOpen, setCreateOpen] = useState(false);
  const [newRoomTitle, setNewRoomTitle] = useState("");
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [isLoadingOpenRooms, setIsLoadingOpenRooms] = useState(true);
  const [openRoomsError, setOpenRoomsError] = useState<string | null>(null);
  const [pendingJoinRoom, setPendingJoinRoom] = useState<ChatRoom | null>(null);

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

  const filteredRooms = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    return rooms.filter((room) => {
      if (room.category !== activeTab) return false;
      if (!normalizedQuery) return true;
      return room.title.toLowerCase().includes(normalizedQuery);
    });
  }, [activeTab, rooms, searchQuery]);

  const handleCreateRoom = async () => {
    const trimmedTitle = newRoomTitle.trim();
    if (!trimmedTitle || isCreatingRoom) return;

    try {
      setIsCreatingRoom(true);
      const createdRoom = await createChatRoom({
        title: trimmedTitle,
        thumbnailImageObjectKey: DEFAULT_CHAT_ROOM_THUMBNAIL_OBJECT_KEY,
      });

      setRooms((prev) => [
        {
          id: String(createdRoom.id ?? `mine-${Date.now()}`),
          title: createdRoom.title,
          memberCount: createdRoom.memberCount,
          category: "mine",
        },
        ...prev,
      ]);
      setNewRoomTitle("");
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

  const handleJoinRoom = () => {
    if (!pendingJoinRoom) return;

    const joinedRoom = {
      ...pendingJoinRoom,
      id: `mine-copy-${pendingJoinRoom.id}`,
      category: "mine" as const,
      unreadCount: undefined,
    };

    setRooms((prev) => {
      const alreadyJoined = prev.some(
        (room) =>
          room.title === pendingJoinRoom.title && room.category === "mine",
      );
      if (alreadyJoined) return prev;

      return [joinedRoom, ...prev];
    });
    setPendingJoinRoom(null);
    setActiveTab("mine");
    router.push(buildChatRoomHref(joinedRoom));
  };

  return (
    <div className="min-h-screen bg-white">
      <main className="px-6 pb-20 pt-10">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="뒤로 가기"
          className="-ml-3 flex h-10 w-10 items-center justify-center"
        >
          <Image src="/icons/back.svg" alt="" width={22} height={22} />
        </button>

        <div className="flex items-center justify-between">
          <h1 className="mt-7 text-[26px] font-semibold tracking-[-0.04em] text-[#121212]">
            채팅
          </h1>
          <button
            type="button"
            aria-label="그룹 채팅방 만들기"
            onClick={() => setCreateOpen(true)}
            className="flex h-11 w-11 items-center justify-center rounded-full text-[#111111]"
          >
            <PlusIcon />
          </button>
        </div>

        <div className="mt-6 rounded-[20px] bg-[#f2f2f2] px-4 py-4">
          <label className="flex items-center gap-3">
            <SearchIcon />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="찾으시는 채팅방 이름을 검색해주세요."
              className="w-full bg-transparent text-[14px] text-[#202020] outline-none placeholder:text-[#b8b8b8]"
            />
          </label>
        </div>

        <div className="mt-6 flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setActiveTab("mine")}
            className={`rounded-full border px-4 py-2 text-[15px] font-medium leading-none transition-colors ${
              activeTab === "mine"
                ? "border-black bg-black text-white"
                : "border-[#101010] bg-white text-[#111111]"
            }`}
          >
            내 그룹채팅
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("open")}
            className={`rounded-full border px-4 py-2 text-[15px] font-medium leading-none transition-colors ${
              activeTab === "open"
                ? "border-black bg-black text-white"
                : "border-[#101010] bg-white text-[#111111]"
            }`}
          >
            오픈그룹채팅
          </button>
        </div>

        <div
          className={
            activeTab === "open"
              ? "mt-11 grid grid-cols-2 gap-x-4 gap-y-8"
              : "mt-11 space-y-5"
          }
        >
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

          {!isLoadingOpenRooms &&
            filteredRooms.map((room) => (
              <ChatRoomCard
                key={room.id}
                room={room}
                onClick={() => {
                  if (room.category === "open") {
                    setPendingJoinRoom(room);
                    return;
                  }

                  router.push(buildChatRoomHref(room));
                }}
              />
            ))}

          {!isLoadingOpenRooms && !openRoomsError && filteredRooms.length === 0 && (
            <div className="rounded-[24px] border border-dashed border-[#cfcfcf] px-5 py-12 text-center text-[15px] text-[#8c8c8c]">
              조건에 맞는 채팅방이 없습니다.
            </div>
          )}
        </div>
      </main>

      <ChatActionModal
        open={createOpen}
        title="그룹 채팅방 만들기"
        onCancel={() => {
          if (isCreatingRoom) return;
          setCreateOpen(false);
          setNewRoomTitle("");
        }}
        onConfirm={handleCreateRoom}
        confirmLabel={isCreatingRoom ? "생성 중..." : "완료"}
        confirmDisabled={!newRoomTitle.trim() || isCreatingRoom}
      >
        <input
          value={newRoomTitle}
          onChange={(event) => setNewRoomTitle(event.target.value)}
          placeholder="채팅방 제목을 입력해주세요."
          disabled={isCreatingRoom}
          className="h-14 w-full rounded-[20px] bg-[#f3f3f3] px-5 text-[16px] text-[#111111] outline-none placeholder:text-[#bbbbbb]"
        />
      </ChatActionModal>

      <ChatActionModal
        open={Boolean(pendingJoinRoom)}
        title={`“ ${pendingJoinRoom?.title ?? ""} ”\n현재 채팅방에 참여하시겠습니까?`}
        onCancel={() => setPendingJoinRoom(null)}
        onConfirm={handleJoinRoom}
        confirmLabel="참여하기"
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
