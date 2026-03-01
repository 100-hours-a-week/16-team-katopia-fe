import Image from "next/image";

export default function VoteEmptyState() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-6 text-center text-white">
      <Image
        src="/icons/circle-alert.svg"
        alt=""
        width={72}
        height={72}
        className="opacity-70 invert"
      />
      <p className="text-[15px] font-semibold">
        현재 투표 가능한 투표가 존재하지 않습니다.
      </p>
    </div>
  );
}
