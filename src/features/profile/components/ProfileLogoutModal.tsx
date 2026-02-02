"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { logout } from "@/src/features/auth/api/logout";
import { useAuth } from "@/src/features/auth/providers/AuthProvider";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function ProfileLogoutModal({ open, onClose }: Props) {
  const router = useRouter();
  const { setAuthenticated } = useAuth();

  if (!open) return null;

  const handleLogout = async () => {
    try {
      await logout();
    } catch (e) {
      console.error(e);
    } finally {
      setAuthenticated(false);
      onClose();
      router.replace("/home");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="w-[320px] rounded-3xl bg-white px-6 py-6 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full">
          <Image src="/icons/notice.svg" alt="" width={56} height={56} />
        </div>

        <p className="mb-2 text-base text-black">
          <span className="font-bold">로그아웃</span> 하시겠습니까?
        </p>
        <p className="mb-6 text-sm text-gray-400">
          현재 계정에서 로그아웃됩니다.
        </p>

        <div className="flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 rounded-full py-3 text-sm font-semibold"
          >
            취소
          </button>
          <button
            onClick={handleLogout}
            className="flex-1 rounded-full py-3 text-sm font-semibold"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}
