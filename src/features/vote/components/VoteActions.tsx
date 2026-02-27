import Image from "next/image";

type Props = {
  disabled: boolean;
  onRefresh: () => void;
};

export default function VoteActions({ disabled, onRefresh }: Props) {
  return (
    <section className="mt-6 flex items-center justify-center gap-4">
      <button
        type="button"
        onClick={onRefresh}
        disabled={disabled}
        className="flex h-14 w-full max-w-55 items-center justify-center gap-2 rounded-full bg-white text-[15px] font-semibold text-black disabled:opacity-40"
      >
        <Image
          src="/icons/refresh.svg"
          alt="다른 투표 불러오기"
          width={20}
          height={20}
          className="h-5 w-5"
          draggable={false}
          onDragStart={(e) => e.preventDefault()}
        />
        다른 투표 불러오기
      </button>
    </section>
  );
}
