"use client";

import Image from "next/image";

function UploadIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M12 16V4" strokeLinecap="round" />
      <path d="M7.5 8.5L12 4l4.5 4.5" strokeLinecap="round" />
      <path d="M5 20h14" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-7 w-7"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
    </svg>
  );
}

type CreateChatRoomModalProps = {
  open: boolean;
  heading?: string;
  title: string;
  thumbnailPreview: string | null;
  defaultImages: string[];
  isSubmitting: boolean;
  onTitleChange: (value: string) => void;
  onUploadClick: () => void;
  onSelectDefaultImage: (image: string) => void;
  onClose: () => void;
  onConfirm: () => void;
  confirmLabel?: string;
  confirmLoadingLabel?: string;
  canSubmit?: boolean;
};

export default function CreateChatRoomModal({
  open,
  heading = "채팅방 만들기",
  title,
  thumbnailPreview,
  defaultImages,
  isSubmitting,
  onTitleChange,
  onUploadClick,
  onSelectDefaultImage,
  onClose,
  onConfirm,
  confirmLabel = "만들기",
  confirmLoadingLabel = "만드는 중",
  canSubmit: canSubmitOverride,
}: CreateChatRoomModalProps) {
  if (!open) return null;
  const hasThumbnailPreview = Boolean(thumbnailPreview);
  const canSubmit =
    canSubmitOverride ??
    Boolean(title.trim() && thumbnailPreview && !isSubmitting);

  return (
    <div className="fixed inset-0 z-80 flex items-center justify-center bg-black/45 px-6 py-10">
      <div className="w-full max-w-[414px] rounded-[34px] bg-white px-7 pb-10 pt-8 shadow-[0_24px_80px_rgba(0,0,0,0.22)]">
        <div className="relative flex items-center justify-center">
          <p className="text-center text-[18px] font-semibold tracking-[-0.05em] text-[#111111]">
            {heading}
          </p>
          <button
            type="button"
            onClick={onClose}
            aria-label="모달 닫기"
            className="absolute right-0 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center text-[#666666]"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="mt-14">
          <p className="text-[14px] font-semibold text-[#4a5568]">
            채팅방 제목
          </p>
          <input
            value={title}
            onChange={(event) => onTitleChange(event.target.value)}
            data-testid="chat-room-title-input"
            placeholder="채팅방 제목을 입력하세요"
            disabled={isSubmitting}
            className="mt-4 h-[60px] w-full rounded-[24px] bg-[#f8f8fb] px-6 text-[14px] text-[#111111] outline-none placeholder:text-[#8b8fa1] disabled:opacity-70"
          />
        </div>

        <div className="mt-12">
          <p className="text-[15px] font-semibold text-[#4a5568]">
            채팅방 이미지
          </p>
          <button
            type="button"
            onClick={onUploadClick}
            className="mt-4 flex h-[72px] w-full items-center justify-center gap-3 overflow-hidden rounded-[24px] bg-[#f8f8fb] text-[14px] font-semibold text-[#111111]"
          >
            {hasThumbnailPreview ? (
              <div className="relative h-full w-full">
                <Image
                  src={thumbnailPreview!}
                  alt=""
                  fill
                  sizes="(max-width: 430px) 100vw, 360px"
                  className="object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center gap-3 bg-black/20 text-white">
                  <UploadIcon />
                  이미지 변경
                </div>
              </div>
            ) : (
              <>
                <UploadIcon />
                이미지 업로드
              </>
            )}
          </button>

          <p className="mt-6 text-[15px] text-[#7f8798]">
            또는 기본 이미지 선택
          </p>

          <div className="mt-6 grid grid-cols-3 gap-4">
            {defaultImages.map((image, index) => {
              const isSelected = thumbnailPreview === image;

              return (
                <button
                  key={image}
                  type="button"
                  onClick={() => onSelectDefaultImage(image)}
                  data-testid={`chat-default-image-${index}`}
                  className={`relative aspect-square overflow-hidden rounded-[26px] ${
                    isSelected
                      ? "ring-4 ring-black ring-offset-2 ring-offset-white"
                      : ""
                  }`}
                >
                  <Image
                    src={image}
                    alt=""
                    fill
                    sizes="(max-width: 430px) 28vw, 120px"
                    className="object-cover"
                  />
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-14 grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={onClose}
            className="h-[54px] rounded-[24px] bg-[#f5f6fa] text-[15px] font-semibold text-[#111111]"
          >
            취소
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!canSubmit}
            data-testid="chat-room-confirm-button"
            className={`h-[54px] rounded-[24px] text-[15px] font-semibold transition-colors ${
              canSubmit
                ? "bg-[#111111] text-white"
                : "cursor-not-allowed bg-[#eef0f5] text-[#b9bfcc]"
            }`}
          >
            {isSubmitting ? confirmLoadingLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
