import Image from "next/image";

type Profile = {
  nickname: string;
  profileImageUrl: string | null;
  gender: "male" | "female" | null;
  height: number | null;
  weight: number | null;
};

export default function ProfileSummary({
  profile,
  loading,
}: {
  profile: Profile | null;
  loading: boolean;
}) {
  if (loading || !profile) return null;

  const { nickname, profileImageUrl, gender, height, weight } = profile;

  const hasBodyInfo = height !== null || weight !== null;

  return (
    <section className="flex flex-col items-center py-16">
      {/* Avatar */}
      <div className="mb-4 h-24 w-24 rounded-full bg-gray-200 relative overflow-hidden">
        <Image
          src={profileImageUrl ?? "/icons/user.svg"}
          alt="profile"
          fill
          sizes="96px"
          className="object-cover"
        />
      </div>

      {/* Nickname */}
      <p
        className="mb-1 text-[13px] font-semibold"
        style={{ color: "#121212" }}
      >
        {nickname}
        {gender && (
          <span className="ml-1 inline-flex items-center relative top-[4px]">
            <Image
              src={gender === "female" ? "/icons/woman.svg" : "/icons/man.svg"}
              alt={gender === "female" ? "여성" : "남성"}
              width={16}
              height={16}
            />
          </span>
        )}
      </p>

      {/* Body Info */}
      {hasBodyInfo && (
        <p className="text-xs text-gray-600">
          {height !== null && <span>{height}cm</span>}
          {height !== null && weight !== null && <span> · </span>}
          {weight !== null && <span>{weight}kg</span>}
        </p>
      )}
    </section>
  );
}
