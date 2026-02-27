"use client";

type Props = {
  open: boolean;
  title?: string;
  deleting?: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
};

export default function VoteDeleteConfirmModal({
  open,
  title,
  deleting,
  onClose,
  onConfirm,
}: Props) {
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
        <p className="mb-2 text-base text-black">
          해당 투표를 <span className="font-bold">삭제</span>할까요?
        </p>
        {title && <p className="mb-4 text-xs text-gray-500">{title}</p>}
        <p className="mb-6 text-sm text-gray-400">
          삭제하면 복구할 수 없습니다.
        </p>
        <div className="flex gap-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-full border border-black py-3 text-sm font-semibold"
          >
            취소
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-full border border-[#ff3b30] py-3 text-sm font-semibold text-[#ff3b30]"
          >
            {deleting ? "삭제 중..." : "삭제"}
          </button>
        </div>
      </div>
    </div>
  );
}
