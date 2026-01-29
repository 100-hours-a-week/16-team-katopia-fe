import Image from "next/image";

type Profile = {
  nickname: string;
  profileImageUrl: string | null;
  gender: "male" | "female" | null;
  height: number | null;
  weight: number | null;
  style?: string[] | null;
};

export default function ProfileSummary({
  profile,
  loading,
}: {
  profile: Profile | null;
  loading: boolean;
}) {
  if (loading || !profile) return null;

  const { nickname, profileImageUrl, gender, height, weight, style } = profile;

  const hasBodyInfo = height != null || weight != null;
  const styles = (style ?? []).filter(Boolean);
  const hasStyle = styles.length > 0;

  return (
    <section className="flex flex-col items-center py-16">
      {/* Avatar */}
      <div className="mb-4 h-24 w-24 rounded-full bg-gray-200 relative overflow-hidden flex items-center justify-center">
        {profileImageUrl ? (
          <Image
            src={profileImageUrl}
            alt="profile"
            fill
            sizes="96px"
            className="object-cover"
          />
        ) : (
          <Image src="/icons/user.svg" alt="profile" width={45} height={45} />
        )}
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
              width={14}
              height={14}
            />
          </span>
        )}
      </p>

      {/* Body Info */}
      {hasBodyInfo && (
        <p className="text-xs text-gray-600">
          {height != null && <span>{height}cm</span>}
          {height != null && weight != null && <span> · </span>}
          {weight != null && <span>{weight}kg</span>}
        </p>
      )}

      {hasStyle && (
        <p className="mt-2 text-xs text-gray-600">
          {styles.join(" · ")}
        </p>
      )}
    </section>
  );
}
