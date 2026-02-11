type Props = {
  question: string;
  progressLabel: string;
  percent: number;
};

export default function VoteProgress({ question, progressLabel, percent }: Props) {
  return (
    <section className="mt-8">
      <p className="text-[20px] font-semibold leading-snug">{question}</p>
      <div className="mt-4 flex items-center justify-between text-[13px] text-white/70">
        <span>{progressLabel}</span>
      </div>
      <div className="mt-3 h-[4px] w-full rounded-full bg-white/20">
        <div className="h-full rounded-full bg-white" style={{ width: `${percent}%` }} />
      </div>
    </section>
  );
}
