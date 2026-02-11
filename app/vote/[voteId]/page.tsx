export default function VoteResultPage({
  params,
}: {
  params: { voteId: string };
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-2 text-sm text-gray-600">
      <p className="text-base font-semibold text-[#121212]">투표 결과</p>
      <p>투표 ID: {params.voteId}</p>
    </div>
  );
}
