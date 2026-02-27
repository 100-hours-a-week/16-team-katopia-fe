"use client";

import Link from "next/link";
import Image from "next/image";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function UploadCard({
  title,
  description,
  variant,
  href,
}: {
  title: string;
  description: string;
  variant: "post" | "vote";
  href: string;
}) {
  return (
    <div className="flex h-75 flex-col rounded-[22px] border border-gray-200 bg-white px-4 pb-4 pt-5 shadow-[0_1px_0_rgba(0,0,0,0.04)]">
      <p className="text-[14px] font-semibold text-[#121212]">{title}</p>
      <p className="mt-1 text-[10px] text-gray-500">{description}</p>

      <div className="mt-4 flex flex-1 items-center justify-center overflow-hidden rounded-[14px] bg-gray-100">
        {variant === "post" ? (
          <Image
            src="/images/post_ex.webp"
            alt="게시글 예시"
            width={320}
            height={200}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="grid h-full w-full grid-cols-2 gap-2 p-3">
            {[
              "/images/vote_1.jpeg",
              "/images/vote_2.jpeg",
              "/images/vote_3.webp",
              "/images/vote_4.webp",
            ].map((src, index) => (
              <Image
                key={src}
                src={src}
                alt={`투표 예시 ${index + 1}`}
                width={160}
                height={160}
                className="h-full w-full rounded-[10px] object-cover"
              />
            ))}
          </div>
        )}
      </div>

      <SheetClose asChild>
        <Link
          href={href}
          className="mt-4 flex h-9 items-center justify-center rounded-full bg-black text-[12px] font-semibold text-white"
        >
          선택하기
        </Link>
      </SheetClose>
    </div>
  );
}

export default function CreateBottomSheet({ open, onOpenChange }: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        showClose={false}
        className="
          rounded-t-[28px]
          px-5 pb-8 pt-4
          w-full max-w-107.5 mx-auto
          min-h-[40vh]
          bg-white
        "
      >
        <div className="mx-auto h-1 w-10 rounded-full bg-gray-200" />

        <div className="mt-3 space-y-3 text-center">
          <SheetTitle className="text-[16px] font-semibold text-[#121212]">
            업로드
          </SheetTitle>
          <p className="text-[13px] text-gray-500">
            콘텐츠를 업로드하고 코디를 공유해보세요.
          </p>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-4">
          <UploadCard
            title="게시물 작성"
            description="현재 코디를 공유해요."
            variant="post"
            href="/post"
          />
          <UploadCard
            title="투표 작성"
            description="고민되는 코디나 옷을 공유해요."
            variant="vote"
            href="/vote/create"
          />
        </div>

        <SheetClose asChild>
          <button
            type="button"
            className="mt-3 flex h-12 w-full items-center justify-center rounded-full border border-gray-200 text-[14px] font-semibold text-[#121212]"
          >
            취소
          </button>
        </SheetClose>
      </SheetContent>
    </Sheet>
  );
}
