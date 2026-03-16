import ChatRoomPage from "@/src/features/chat/pages/ChatRoomPage";

type ChatRoomRoutePageProps = {
  params: Promise<{
    roomId: string;
  }>;
  searchParams?: Promise<{
    title?: string;
    memberCount?: string;
    thumbnail?: string;
  }>;
};

export default async function Page({
  params,
  searchParams,
}: ChatRoomRoutePageProps) {
  const { roomId } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  return (
    <ChatRoomPage
      roomId={roomId}
      initialTitle={resolvedSearchParams?.title}
      initialMemberCount={resolvedSearchParams?.memberCount}
      initialThumbnail={resolvedSearchParams?.thumbnail}
    />
  );
}
