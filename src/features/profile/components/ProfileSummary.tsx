import Image from "next/image";
import Avatar from "@/src/shared/components/Avatar";

type Profile = {
  nickname: string;
  profileImageUrl: string | null;
  gender: "male" | "female" | null;
  height: number | null;
  weight: number | null;
  style?: string[] | null;
};

type ProfileStats = {
  postCount?: number | null;
  followerCount?: number | null;
  followingCount?: number | null;
  friendCount?: number | null;
};

export default function ProfileSummary({
  profile,
  loading,
  stats,
  onFollowerClick,
  onFollowingClick,
}: {
  profile: Profile | null;
  loading: boolean;
  stats?: ProfileStats;
  onFollowerClick?: () => void;
  onFollowingClick?: () => void;
}) {
  if (loading || !profile) return null;

  const { nickname, profileImageUrl, gender, height, weight, style } = profile;

  const hasBodyInfo = (height ?? 0) > 0 || (weight ?? 0) > 0;
  const styles = (style ?? []).filter(Boolean);
  const hasStyle = styles.length > 0;
  const postCount = stats?.postCount ?? null;
  const followerCount = stats?.followerCount ?? null;
  const followingCount = stats?.followingCount ?? null;
  const friendCount = stats?.friendCount ?? null;

  const statsItems = [
    postCount !== null && { label: "게시물", value: postCount },
    followerCount !== null && {
      label: "팔로워",
      value: followerCount,
      onClick: onFollowerClick,
    },
    followingCount !== null && {
      label: "팔로잉",
      value: followingCount,
      onClick: onFollowingClick,
    },
    friendCount !== null && { label: "친구 수", value: friendCount },
  ].filter(Boolean) as {
    label: string;
    value: number | string;
    onClick?: () => void;
  }[];

  const hasStats = statsItems.length > 0;

  return (
    <section className="flex flex-col items-center py-13">
      <div className="flex items-center gap-12">
        <div className="flex flex-col items-center">
          <div className="mb-4">
            <Avatar
              src={profileImageUrl}
              alt="profile"
              size={96}
              fallbackSrc="/icons/user.svg"
              fallbackSize={45}
              className="bg-gray-200"
            />
          </div>

          <p className="mb-1 text-[13px] font-semibold text-[#121212]">
            {nickname}
            {gender && (
              <span className="ml-1 inline-flex items-center relative top-1">
                <Image
                  src={
                    gender === "female" ? "/icons/woman.svg" : "/icons/man.svg"
                  }
                  alt={gender === "female" ? "여성" : "남성"}
                  width={14}
                  height={14}
                />
              </span>
            )}
          </p>

          {hasBodyInfo && (
            <p className="text-xs text-gray-600">
              {(height ?? 0) > 0 && <span>{height}cm</span>}
              {(height ?? 0) > 0 && (weight ?? 0) > 0 && <span> · </span>}
              {(weight ?? 0) > 0 && <span>{weight}kg</span>}
            </p>
          )}

          {hasStyle && (
            <p className="mt-2 text-xs text-gray-600">{styles.join(" · ")}</p>
          )}
        </div>

        {hasStats && (
          <div className="flex items-center gap-12 text-center">
          {statsItems.map((item) => (
            <div key={item.label}>
              {item.onClick ? (
                <button
                  type="button"
                  onClick={item.onClick}
                  className="flex flex-col items-center"
                >
                  <p className="text-[14px] font-semibold text-[#121212]">
                    {item.value}
                  </p>
                  <p className="mt-1 text-[12px] text-gray-600">
                    {item.label}
                  </p>
                </button>
              ) : (
                <>
                  <p className="text-[14px] font-semibold text-[#121212]">
                    {item.value}
                  </p>
                  <p className="mt-1 text-[12px] text-gray-600">
                    {item.label}
                  </p>
                </>
              )}
            </div>
          ))}
          </div>
        )}
      </div>
    </section>
  );
}
