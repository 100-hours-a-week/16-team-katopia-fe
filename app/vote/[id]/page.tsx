import VoteResultPage from "@/src/features/vote/VoteResultPage";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: Props) {
  const { id } = await params;
  return <VoteResultPage voteId={id} />;
}
