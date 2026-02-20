"use client";

import Image from "next/image";

export function EmptyNotification() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 py-10 text-center">
      <Image
        src="/icons/circle-alert.svg"
        alt=""
        width={80}
        height={80}
        className="opacity-40"
      />
      <p className="text-[14px] font-medium text-[#6f6f6f]">
        알림 메시지가 없습니다.
      </p>
      <p className="text-[13px] text-[#bdbdbd]">
        최근 7일 간의 알림을 확인하실 수 있습니다.
      </p>
    </div>
  );
}
