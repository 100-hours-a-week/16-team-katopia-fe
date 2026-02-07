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

export default function ProfileSummary({
  profile,
  loading,
}: {
  profile: Profile | null;
  loading: boolean;
}) {
  if (loading || !profile) return null;

  const { nickname, profileImageUrl, gender, height, weight, style } = profile;

  const hasBodyInfo = (height ?? 0) > 0 || (weight ?? 0) > 0;
  const styles = (style ?? []).filter(Boolean);
  const hasStyle = styles.length > 0;

  return (
    <section className="flex flex-col items-center py-16">
      {/* Avatar */}
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

      {/* Nickname */}
      <p
        className="mb-1 text-[13px] font-semibold"
        style={{ color: "#121212" }}
      >
        {nickname}
        {gender && (
          <span className="ml-1 inline-flex items-center relative top-1">
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
          {(height ?? 0) > 0 && <span>{height}cm</span>}
          {(height ?? 0) > 0 && (weight ?? 0) > 0 && <span> · </span>}
          {(weight ?? 0) > 0 && <span>{weight}kg</span>}
        </p>
      )}

      {hasStyle && (
        <p className="mt-2 text-xs text-gray-600">{styles.join(" · ")}</p>
      )}
    </section>
  );
}
