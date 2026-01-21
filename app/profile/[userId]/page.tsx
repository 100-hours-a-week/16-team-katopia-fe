import UserProfilePage from "@/src/features/profile/components/UserProfilePage";

interface Props {
  params: Promise<{
    userId: string;
  }>;
}

export default async function Page({ params }: Props) {
  const { userId } = await params;
  return <UserProfilePage userId={userId} />;
}
