import VoteResultLoading from "./VoteResultLoading";
import VoteResultView from "./VoteResultView";

type VoteFinalStepProps = {
  showResult: boolean;
  resultItems: { id: string; imageUrl: string }[];
  resultStats: { likeCount: number; likePercent: number }[];
  onRefresh: () => void;
};

export default function VoteFinalStep({
  showResult,
  resultItems,
  resultStats,
  onRefresh,
}: VoteFinalStepProps) {
  if (!showResult) {
    return <VoteResultLoading variant="submitting" />;
  }

  return (
    <VoteResultView
      totalVotes={resultStats.reduce((sum, s) => sum + s.likeCount, 0)}
      items={resultItems.map((item, i) => ({
        imageUrl: item.imageUrl,
        dislikePercent: 0,
        dislikeCount: 0,
        likePercent: resultStats[i]?.likePercent ?? 0,
        likeCount: resultStats[i]?.likeCount ?? 0,
      }))}
      onRefresh={onRefresh}
    />
  );
}
