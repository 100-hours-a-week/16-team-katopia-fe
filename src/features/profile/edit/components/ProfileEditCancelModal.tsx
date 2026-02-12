import { useEffect } from "react";
import Image from "next/image";

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export default function ProfileEditCancelModal({
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

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="w-90 rounded-3xl bg-white px-6 py-6 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full">
          <Image src="/icons/notice.svg" alt="" width={60} height={60} />
        </div>

        <p className="mb-2 text-base text-black">
          프로필 수정을 <span className="font-bold">취소</span>하고
          나가시겠습니까?
        </p>

        <p className="mb-6 text-sm text-gray-400">
          변경한 내용은 저장되지 않습니다.
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
            확인
          </button>
        </div>
      </div>
    </div>
  );
}
