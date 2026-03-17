"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";

import { useAuth } from "@/src/features/auth/providers/AuthProvider";
import { deleteChatRoom } from "@/src/features/chat/api/deleteChatRoom";
import { leaveChatRoom } from "@/src/features/chat/api/leaveChatRoom";
import { updateChatRoom } from "@/src/features/chat/api/updateChatRoom";
import ChatInput from "@/src/features/chat/components/ChatInput";
import ChatMessageList from "@/src/features/chat/components/ChatMessageList";
import CreateChatRoomModal from "@/src/features/chat/components/CreateChatRoomModal";
import {
  DEFAULT_CHAT_ROOM_IMAGES,
  DEFAULT_CHAT_ROOM_THUMBNAIL_OBJECT_KEY,
} from "@/src/features/chat/constants";
import { useChatMessages } from "@/src/features/chat/hooks/useChatMessages";
import { useChatRoom } from "@/src/features/chat/hooks/useChatRoom";
import { useChatSocket } from "@/src/features/chat/hooks/useChatSocket";
import { resolveMediaUrl } from "@/src/features/profile/utils/resolveMediaUrl";
import {
  requestUploadPresign,
  uploadToPresignedUrl,
} from "@/src/features/upload/api/presignUpload";
import { processImageFile } from "@/src/features/upload/utils/processImage";

type ChatRoomPageProps = {
  roomId: string;
  initialTitle?: string;
  initialMemberCount?: string;
  initialThumbnail?: string;
  initialThumbnailObjectKey?: string;
  initialIsOwner?: string;
};

export default function ChatRoomPage({
  roomId,
  initialTitle,
  initialMemberCount,
  initialThumbnail,
  initialThumbnailObjectKey,
  initialIsOwner,
}: ChatRoomPageProps) {
  const router = useRouter();
  const { currentMember, isAuthenticated, ready } = useAuth();
  const { status: socketStatus, subscribe, publish } = useChatSocket(
    ready && isAuthenticated,
  );
  const {
    roomTitle,
    setRoomTitle,
    roomThumbnailSrc,
    setRoomThumbnailSrc,
    roomThumbnailObjectKey,
    setRoomThumbnailObjectKey,
    roomMemberCount,
    resolvedIsOwner,
  } = useChatRoom({
    roomId,
    initialTitle,
    initialMemberCount,
    initialThumbnail,
    initialThumbnailObjectKey,
    initialIsOwner,
  });
  const {
    messages,
    unreadCountByMessageId,
    isLoadingMessages,
    isLoadingMoreMessages,
    messagesError,
    messageEndRef,
    sendMessage,
  } = useChatMessages({
    roomId,
    currentMemberId: currentMember?.id,
    roomMemberCount,
    socketStatus,
    subscribe,
    publish,
  });

  const [menuOpen, setMenuOpen] = useState(false);
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [editTitle, setEditTitle] = useState(
    initialTitle?.trim() || "패션에 고민있는 사람 모여라!!!!!",
  );
  const [editThumbnailPreview, setEditThumbnailPreview] = useState<string | null>(
    initialThumbnail?.trim() || null,
  );
  const [editThumbnailFile, setEditThumbnailFile] = useState<File | null>(null);
  const [editSelectedDefaultThumbnail, setEditSelectedDefaultThumbnail] =
    useState<string | null>(null);
  const [isUpdatingRoom, setIsUpdatingRoom] = useState(false);
  const [isDeletingRoom, setIsDeletingRoom] = useState(false);
  const [isLeavingRoom, setIsLeavingRoom] = useState(false);
  const [messageInput, setMessageInput] = useState("");
  const [pendingImagePreview, setPendingImagePreview] = useState<string | null>(
    null,
  );
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  const [expandedImageUrl, setExpandedImageUrl] = useState<string | null>(null);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const menuAreaRef = useRef<HTMLDivElement>(null);
  const editImageInputRef = useRef<HTMLInputElement>(null);
  const messageImageInputRef = useRef<HTMLInputElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);

  const hasEditedTitle = editTitle.trim() !== roomTitle.trim();
  const hasEditedThumbnail =
    Boolean(editThumbnailFile) ||
    (editSelectedDefaultThumbnail !== null &&
      editSelectedDefaultThumbnail !== roomThumbnailSrc);
  const canSubmitEdit = Boolean(
    editTitle.trim() &&
      editThumbnailPreview &&
      !isUpdatingRoom &&
      (hasEditedTitle || hasEditedThumbnail),
  );

  useEffect(() => {
    return () => {
      if (editThumbnailPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(editThumbnailPreview);
      }
    };
  }, [editThumbnailPreview]);

  useEffect(() => {
    if (!menuOpen) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (menuAreaRef.current?.contains(target)) return;
      setMenuOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [menuOpen]);

  const handleSelectMessageImage = async (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const processed = await processImageFile(file, {
        maxLongSide: 1600,
        quality: 0.92,
        outputType: "image/webp",
      });

      setMessageInput("");
      if (pendingImagePreview?.startsWith("blob:")) {
        URL.revokeObjectURL(pendingImagePreview);
      }

      const processedFile = new File(
        [processed.blob],
        file.name.replace(/\.[^.]+$/, `.${processed.extension}`),
        {
          type: processed.contentType,
        },
      );
      const objectUrl = URL.createObjectURL(processedFile);
      setPendingImagePreview(objectUrl);
      setPendingImageFile(processedFile);
      window.requestAnimationFrame(() => {
        messageInputRef.current?.focus();
      });
    } catch (error) {
      window.alert(
        error instanceof Error
          ? error.message
          : "이미지 처리 중 오류가 발생했습니다.",
      );
    } finally {
      event.target.value = "";
    }
  };

  const handleSendMessage = async () => {
    if (isSendingMessage) return;

    setIsSendingMessage(true);
    await sendMessage({
      messageInput,
      pendingImagePreview,
      pendingImageFile,
      onStart: () => {
        setMessageInput("");
        setPendingImagePreview(null);
        setPendingImageFile(null);
      },
      onErrorRestore: () => {
        setMessageInput(messageInput.trim());
        setPendingImagePreview(pendingImagePreview);
        setPendingImageFile(pendingImageFile);
      },
      onFinally: () => {
        setIsSendingMessage(false);
      },
    });
  };

  return (
    <div className="mx-auto min-h-screen w-full max-w-[430px] bg-white">
      <header className="fixed left-1/2 top-0 z-20 w-full max-w-[430px] -translate-x-1/2 bg-white shadow-[0_10px_14px_-12px_rgba(17,17,17,0.28)]">
        <div className="flex items-center gap-4 px-5 pb-4 pt-6">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="뒤로 가기"
            className="flex h-10 w-10 shrink-0 items-center justify-center"
          >
            <Image src="/icons/back.svg" alt="" width={22} height={22} />
          </button>
          <div className="relative h-[64px] w-[64px] shrink-0 overflow-hidden rounded-full bg-[#dddddd]">
            <Image
              src={roomThumbnailSrc}
              alt=""
              fill
              sizes="64px"
              className="object-cover"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-semibold tracking-[-0.03em] text-[#111111]">
              {roomTitle}
            </p>
            <div className="mt-2 flex items-center gap-1 text-[13px] font-medium text-[#111111]">
              <Image src="/icons/user.svg" alt="" width={14} height={14} />
              <span className="leading-none">{roomMemberCount}</span>
            </div>
          </div>
          <div ref={menuAreaRef} className="relative shrink-0">
            <button
              type="button"
              aria-label="채팅방 메뉴"
              onClick={() => setMenuOpen((prev) => !prev)}
              className="flex h-10 w-10 items-center justify-center"
            >
              <Image src="/icons/more.svg" alt="" width={18} height={18} />
            </button>
            {menuOpen ? (
              <div className="absolute right-0 top-[42px] z-30 min-w-[82px] overflow-hidden rounded-[14px] border border-[#1f1f1f] bg-white shadow-[0_10px_22px_rgba(0,0,0,0.08)]">
                {resolvedIsOwner ? (
                  <div className="flex flex-col">
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        setEditTitle(roomTitle);
                        setEditThumbnailPreview(roomThumbnailSrc);
                        setEditThumbnailFile(null);
                        setEditSelectedDefaultThumbnail(null);
                        setEditOpen(true);
                      }}
                      className="flex h-9 w-full items-center justify-center bg-white text-[13px] font-medium text-[#111111] transition-colors hover:bg-[#f4f4f4]"
                    >
                      수정
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        setDeleteConfirmOpen(true);
                      }}
                      className="flex h-9 w-full items-center justify-center border-t border-[#1f1f1f] bg-[#fff1f1] text-[13px] font-medium text-[#ff4d4f] transition-colors hover:bg-[#ffe7e7]"
                    >
                      삭제
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      setLeaveConfirmOpen(true);
                    }}
                    className="flex w-full items-center justify-center rounded-[10px] border border-[#ff4d4f] bg-[#fff1f1] px-3 py-2 text-[12px] font-medium text-[#ff4d4f]"
                  >
                    나가기
                  </button>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <main className="px-6 pb-[calc(env(safe-area-inset-bottom)+132px)] pt-[126px]">
        <ChatMessageList
          roomId={roomId}
          messages={messages}
          unreadCountByMessageId={unreadCountByMessageId}
          isLoadingMessages={isLoadingMessages}
          isLoadingMoreMessages={isLoadingMoreMessages}
          messagesError={messagesError}
          messageEndRef={messageEndRef}
          onImageClick={setExpandedImageUrl}
        />
      </main>

      <ChatInput
        messageInput={messageInput}
        pendingImagePreview={pendingImagePreview}
        pendingImageFile={pendingImageFile}
        isSendingMessage={isSendingMessage}
        messageInputRef={messageInputRef}
        messageImageInputRef={messageImageInputRef}
        onMessageChange={setMessageInput}
        onSend={() => {
          void handleSendMessage();
        }}
        onRemovePendingImage={() => {
          if (pendingImagePreview?.startsWith("blob:")) {
            URL.revokeObjectURL(pendingImagePreview);
          }
          setPendingImagePreview(null);
          setPendingImageFile(null);
        }}
        onSelectImage={handleSelectMessageImage}
      />

      {leaveConfirmOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-6">
          <div className="w-full max-w-[320px] rounded-[28px] bg-white px-6 py-7 shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
            <p className="text-center text-[19px] font-semibold tracking-[-0.03em] text-[#111111]">
              채팅방에서 나가시겠어요?
            </p>
            <p className="mt-3 text-center text-[14px] leading-6 text-[#6a6a6a]">
              나가기를 선택하면 현재 채팅방 목록에서 사라집니다.
            </p>
            <div className="mt-7 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  if (isLeavingRoom) return;
                  setLeaveConfirmOpen(false);
                }}
                className="h-12 rounded-[16px] border border-[#d5d5d5] text-[15px] font-medium text-[#111111]"
              >
                취소
              </button>
              <button
                type="button"
                disabled={isLeavingRoom}
                onClick={async () => {
                  try {
                    setIsLeavingRoom(true);
                    await leaveChatRoom(roomId);
                    router.replace("/chat");
                  } catch (error) {
                    window.alert(
                      error instanceof Error
                        ? error.message
                        : "채팅방 나가기 중 오류가 발생했습니다.",
                    );
                  } finally {
                    setIsLeavingRoom(false);
                    setLeaveConfirmOpen(false);
                  }
                }}
                className="h-12 rounded-[16px] bg-[#ff4d4f] text-[15px] font-medium text-white disabled:bg-[#ffb3b4]"
              >
                {isLeavingRoom ? "나가는 중..." : "나가기"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <CreateChatRoomModal
        open={editOpen}
        heading="채팅방 수정"
        title={editTitle}
        thumbnailPreview={editThumbnailPreview}
        defaultImages={DEFAULT_CHAT_ROOM_IMAGES}
        isSubmitting={isUpdatingRoom}
        confirmLabel="수정"
        confirmLoadingLabel="수정 중"
        canSubmit={canSubmitEdit}
        onTitleChange={setEditTitle}
        onUploadClick={() => editImageInputRef.current?.click()}
        onSelectDefaultImage={(image) => {
          if (editThumbnailPreview?.startsWith("blob:")) {
            URL.revokeObjectURL(editThumbnailPreview);
          }
          setEditThumbnailPreview(image);
          setEditThumbnailFile(null);
          setEditSelectedDefaultThumbnail(image);
        }}
        onClose={() => {
          if (isUpdatingRoom) return;
          if (editThumbnailPreview?.startsWith("blob:")) {
            URL.revokeObjectURL(editThumbnailPreview);
          }
          setEditTitle(roomTitle);
          setEditThumbnailPreview(roomThumbnailSrc);
          setEditThumbnailFile(null);
          setEditSelectedDefaultThumbnail(null);
          setEditOpen(false);
        }}
        onConfirm={async () => {
          let nextThumbnailImageObjectKey =
            roomThumbnailObjectKey || DEFAULT_CHAT_ROOM_THUMBNAIL_OBJECT_KEY;

          try {
            setIsUpdatingRoom(true);

            if (editThumbnailFile) {
              const extension =
                editThumbnailFile.name.split(".").pop()?.toLowerCase() || "png";
              const [presigned] = await requestUploadPresign("POST", [extension]);
              await uploadToPresignedUrl(
                presigned.uploadUrl,
                editThumbnailFile,
                editThumbnailFile.type || undefined,
              );
              nextThumbnailImageObjectKey = presigned.imageObjectKey.replace(
                /^\/+/,
                "",
              );
            } else if (editSelectedDefaultThumbnail) {
              const imageResponse = await fetch(editSelectedDefaultThumbnail);
              if (!imageResponse.ok) {
                throw new Error("기본 이미지를 불러오지 못했습니다.");
              }
              const imageBlob = await imageResponse.blob();
              const extension =
                editSelectedDefaultThumbnail.split(".").pop()?.toLowerCase() ||
                "png";
              const [presigned] = await requestUploadPresign("POST", [extension]);
              await uploadToPresignedUrl(
                presigned.uploadUrl,
                imageBlob,
                imageBlob.type || `image/${extension}`,
              );
              nextThumbnailImageObjectKey = presigned.imageObjectKey.replace(
                /^\/+/,
                "",
              );
            }

            await updateChatRoom(roomId, {
              title: editTitle.trim(),
              thumbnailImageObjectKey: nextThumbnailImageObjectKey,
            });
            setRoomTitle(editTitle.trim());
            setRoomThumbnailObjectKey(nextThumbnailImageObjectKey);
            setRoomThumbnailSrc(
              resolveMediaUrl(nextThumbnailImageObjectKey) ??
                editThumbnailPreview ??
                "/images/chat_default.png",
            );
            setEditThumbnailFile(null);
            setEditSelectedDefaultThumbnail(null);
            setEditOpen(false);
          } catch (error) {
            window.alert(
              error instanceof Error
                ? error.message
                : "채팅방 수정 중 오류가 발생했습니다.",
            );
          } finally {
            setIsUpdatingRoom(false);
          }
        }}
      />
      <input
        ref={editImageInputRef}
        type="file"
        accept="image/*"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (!file) return;
          if (editThumbnailPreview?.startsWith("blob:")) {
            URL.revokeObjectURL(editThumbnailPreview);
          }
          const objectUrl = URL.createObjectURL(file);
          setEditThumbnailPreview(objectUrl);
          setEditThumbnailFile(file);
          setEditSelectedDefaultThumbnail(null);
          event.target.value = "";
        }}
        className="hidden"
      />

      {deleteConfirmOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-6">
          <div className="w-full max-w-[320px] rounded-[28px] bg-white px-6 py-7 shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
            <p className="text-center text-[19px] font-semibold tracking-[-0.03em] text-[#111111]">
              채팅방을 삭제하시겠어요?
            </p>
            <p className="mt-3 text-center text-[14px] leading-6 text-[#6a6a6a]">
              삭제하면 관련 참여/메시지가 함께 제거됩니다.
            </p>
            <div className="mt-7 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmOpen(false)}
                className="h-12 rounded-[16px] border border-[#d5d5d5] text-[15px] font-medium text-[#111111]"
              >
                취소
              </button>
              <button
                type="button"
                disabled={isDeletingRoom}
                onClick={async () => {
                  try {
                    setIsDeletingRoom(true);
                    await deleteChatRoom(roomId);
                    router.replace("/chat");
                  } catch (error) {
                    window.alert(
                      error instanceof Error
                        ? error.message
                        : "채팅방 삭제 중 오류가 발생했습니다.",
                    );
                  } finally {
                    setIsDeletingRoom(false);
                  }
                }}
                className="h-12 rounded-[16px] bg-[#ff4d4f] text-[15px] font-medium text-white disabled:bg-[#ffb3b4]"
              >
                {isDeletingRoom ? "삭제 중..." : "삭제"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {expandedImageUrl ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/88 px-4"
          onClick={() => setExpandedImageUrl(null)}
          role="dialog"
          aria-modal="true"
          aria-label="확대 이미지"
        >
          <div className="absolute right-5 top-5 flex items-center gap-2">
            <a
              href={expandedImageUrl}
              download
              onClick={(event) => event.stopPropagation()}
              className="flex h-11 items-center justify-center rounded-full bg-white px-4 text-[13px] font-semibold text-[#111111]"
            >
              저장
            </a>
            <button
              type="button"
              onClick={() => setExpandedImageUrl(null)}
              aria-label="확대 이미지 닫기"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white/12 text-white"
            >
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          <div
            className="relative max-h-[72vh] w-full max-w-[560px]"
            onClick={(event) => event.stopPropagation()}
          >
            <img
              src={expandedImageUrl}
              alt=""
              className="mx-auto max-h-[72vh] w-auto max-w-full rounded-[20px] object-contain"
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
