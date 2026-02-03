"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

export default function WithdrawSuccessPage() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6 text-center">
      <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-[#eff3f8]">
        <Image src="/images/logo.png" alt="FITCHECK" width={56} height={56} />
      </div>

      <p className="mb-3 text-xl font-semibold text-black">
        회원탈퇴가 완료되었습니다.
      </p>
      <p className="max-w-xs text-sm leading-6 text-gray-500">
        FITCHECK를 이용해주시고 사랑해주셔서 감사합니다. 더욱더 노력하고
        발전하는 FITCHECK가 되겠습니다.
      </p>

      <button
        type="button"
        onClick={() => router.replace("/home")}
        className="mt-8 w-40 rounded-md bg-[#121212] py-3 text-sm font-semibold text-white"
      >
        확인
      </button>
    </div>
  );
}
