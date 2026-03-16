"use client";

type ChatActionModalProps = {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onCancel: () => void;
  onConfirm: () => void;
  confirmLabel: string;
  confirmDisabled?: boolean;
};

export default function ChatActionModal({
  open,
  title,
  children,
  onCancel,
  onConfirm,
  confirmLabel,
  confirmDisabled = false,
}: ChatActionModalProps) {
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
