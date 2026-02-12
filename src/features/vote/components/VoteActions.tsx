type Props = {
  disabled: boolean;
  onDislike: () => void;
  onLike: () => void;
};

export default function VoteActions({ disabled, onDislike, onLike }: Props) {
  return (
    <section className="mt-6 flex items-center justify-center gap-4">
      <button
        type="button"
        onClick={onDislike}
        disabled={disabled}
        className="flex h-14 w-full max-w-[220px] items-center justify-center gap-2 rounded-full bg-[#ff4d5a] text-[15px] font-semibold text-black disabled:opacity-40"
      >
        <img
          src="/icons/thumbs-down.svg"
          alt=""
          className="h-5 w-5"
          draggable={false}
          onDragStart={(e) => e.preventDefault()}
        />
        별로에요
      </button>
      <button
        type="button"
        onClick={onLike}
        disabled={disabled}
        className="flex h-14 w-full max-w-[220px] items-center justify-center gap-2 rounded-full bg-[#7dff85] text-[15px] font-semibold text-black disabled:opacity-40"
      >
        <img
          src="/icons/thumbs-up.svg"
          alt=""
          className="h-5 w-5"
          draggable={false}
          onDragStart={(e) => e.preventDefault()}
        />
        좋아요
      </button>
    </section>
  );
}
