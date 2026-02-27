import { useEffect } from "react";
import Image from "next/image";
import { createPortal } from "react-dom";

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export default function PostDeleteConfirmModal({
  open,
  onClose,
  onConfirm,
}: Props) {
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

  if (!open || typeof window === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-60 bg-black/40"
      onClick={onClose}
    >
      <div className="mx-auto h-dvh w-full max-w-107.5 px-5">
        <div className="flex h-full items-center justify-center">
          <div
            className="w-90 rounded-3xl bg-white px-6 py-6 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full">
              <Image src="/icons/notice.svg" alt="" width={60} height={60} />
            </div>

            <p className="mb-2 text-base text-black">
              게시글을 <span className="font-bold">삭제</span>하시겠습니까?
            </p>

            <p className="mb-6 text-sm text-gray-400">
              삭제한 게시글은 복구할 수 없습니다.
            </p>

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
                삭제
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
