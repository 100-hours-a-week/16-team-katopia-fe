type Props = {
  title: string;
};

export default function VoteHeader({ title }: Props) {
  return (
    <header className="flex items-center justify-center">
      <p className="text-[15px] font-semibold text-white">{title}</p>
    </header>
  );
}
