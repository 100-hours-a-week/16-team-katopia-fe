import UserProfilePage from "@/src/features/profile/pages/UserProfilePage";

interface Props {
  params: Promise<{
    userId: string;
  }>;
}

export default async function Page({ params }: Props) {
  const { userId } = await params;
  return <UserProfilePage userId={userId} />;
}
