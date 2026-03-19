type VoteSwipeHintProps = {
  visible: boolean;
};

export default function VoteSwipeHint({ visible }: VoteSwipeHintProps) {
  if (!visible) return null;

  return (
    <div className="pointer-events-none absolute inset-x-0 top-4 z-20 flex justify-center">
      <div className="vote-swipe-hint rounded-full border border-white/35 bg-black/55 px-4 py-2 text-[12px] font-semibold text-white backdrop-blur-sm">
        좌로 스와이프: 넘기기 · 우로 스와이프: 좋아요
      </div>
    </div>
  );
}
