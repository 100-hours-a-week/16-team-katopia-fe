"use client";

type HomePostCaptionProps = {
  username: string;
  caption: string;
};

export default function HomePostCaption({
  username,
  caption,
}: HomePostCaptionProps) {
  return (
    <p className="text-[12px] leading-5 text-neutral-900">
      <span className="font-semibold">{username}</span>{" "}
      <span className="text-neutral-800">{caption}</span>
    </p>
  );
}
