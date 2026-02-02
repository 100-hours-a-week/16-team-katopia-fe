import { useEffect } from "react";
import Image from "next/image";

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export default function PostCancelConfirmModal({
  open,
  onClose,
  onConfirm,
}: Props) {
  // ESC 키 닫기
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    // 배경 (overlay)
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      {/* 모달 본문 */}
      <div
        className="w-[360px] rounded-3xl bg-white px-6 py-6 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon */}
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full">
          <Image src="/icons/notice.svg" alt="" width={60} height={60} />
        </div>

        {/* Main Text */}
        <p className="mb-2 text-base text-black">
          게시글 작성을 <span className="font-bold">취소</span>하고
          나가시겠습니까?
        </p>

        {/* Sub Text */}
        <p className="mb-6 text-sm text-gray-400">
          작성하신 내용은 모두 초기화 됩니다.
        </p>

        {/* Buttons */}
        <div className="flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 rounded-full border border-black py-3 text-sm font-semibold"
          >
            취소
          </button>

          <button
            onClick={onConfirm}
            className="flex-1 rounded-full border border-black py-3 text-sm font-semibold"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}
