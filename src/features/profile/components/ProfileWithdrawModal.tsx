import Image from "next/image";

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export default function ProfileWithdrawModal({
  open,
  onClose,
  onConfirm,
}: Props) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="w-[320px] rounded-3xl border-2 border-black bg-white px-6 py-6 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full">
          <Image src="/icons/sadface.svg" alt="" width={56} height={56} />
        </div>

        <p className="mb-2 text-base text-black">
          <span className="font-bold">회원 탈퇴</span>를 진행할까요?
        </p>
        <p className="mb-6 text-sm text-gray-400">
          탈퇴 시 계정 정보가 삭제됩니다.
        </p>

        <div className="flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 rounded-full border-2 border-black py-3 text-sm font-semibold"
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 rounded-full border-2 border-black py-3 text-sm font-semibold"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}
