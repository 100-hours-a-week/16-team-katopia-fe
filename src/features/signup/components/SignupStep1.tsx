"use client";

import { useEffect, useRef, useState } from "react";
import NextImage from "next/image";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";

const signupStep1Schema = z.object({
  nickname: z
    .string()
    .min(2, "닉네임은 최소 2자 이상, 최대 20자 이상만 가능합니다.")
    .max(20, "닉네임은 최소 2자 이상, 최대 20자 이상만 가능합니다.")
    .regex(/^\S+$/, "공백은 입력할 수 없습니다")
    .regex(
      /^[a-zA-Z0-9가-힣ㄱ-ㅎㅏ-ㅣ._]+$/,
      "특수문자는 ‘_’ 또는 ‘.’만 허용됩니다.",
    ),
});

type SignupStep1Values = z.infer<typeof signupStep1Schema>;

export default function SignupStep1() {
  const router = useRouter();
  const [preview, setPreview] = useState<string | null>(null);
  const [duplicateError, setDuplicateError] = useState<string | null>(null);
  const [duplicateSuccess, setDuplicateSuccess] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const {
    register,
    handleSubmit,
    trigger,
    watch,
    formState: { errors },
  } = useForm<SignupStep1Values>({
    resolver: zodResolver(signupStep1Schema),
    mode: "onChange",
    reValidateMode: "onChange",
  });
  const nicknameValue = watch("nickname");
  const [isNicknameVerified, setIsNicknameVerified] = useState(false);

  const loadImage = async (
    file: File,
  ): Promise<{ source: CanvasImageSource; width: number; height: number }> => {
    // 1) 시도: createImageBitmap (지원 브라우저에서 안정적)
    try {
      const bitmap = await createImageBitmap(file);
      return { source: bitmap, width: bitmap.width, height: bitmap.height };
    } catch (e) {
      // 계속 진행해 fallback 시도
    }

    // 2) fallback: ObjectURL + HTMLImageElement
    return await new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const image = new window.Image();
      image.onload = () => {
        URL.revokeObjectURL(url);
        resolve({ source: image, width: image.width, height: image.height });
      };
      image.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("이미지를 불러올 수 없습니다."));
      };
      image.src = url;
    });
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      e.target.value = "";
      return;
    }

    setImageError(null);

    // 확장자/타입 검증
    const allowedExt = ["jpg", "jpeg", "png", "heic"];
    const allowedMime = [
      "image/jpeg",
      "image/png",
      "image/heic",
      "image/heif",
      "image/pjpeg",
    ];
    const ext = file.name.split(".").pop()?.toLowerCase();
    const isAllowedExt = ext ? allowedExt.includes(ext) : false;
    const isAllowedMime = file.type ? allowedMime.includes(file.type) : false;
    if (!isAllowedExt && !isAllowedMime) {
      setPreview(null);
      setImageError(
        "지원하지 않는 확장자입니다.(지원하는 확장자: JPG, JPEG, PNG, HEIC)",
      );
      e.target.value = "";
      return;
    }

    // 용량 검증 (30MB)
    const maxBytes = 30 * 1024 * 1024;
    if (file.size > maxBytes) {
      setPreview(null);
      setImageError("최대 사진 용량은 30MB입니다.");
      e.target.value = "";
      return;
    }

    // 이미지 로드 후 크기 검증 및 중앙 1:1 크롭 + 400x400 리사이즈
    const loaded = await loadImage(file).catch(() => {
      setPreview(null);
      setImageError(
        "이미지를 불러올 수 없습니다. (브라우저에서 지원하지 않는 확장자일 수 있습니다.)",
      );
      e.target.value = "";
      return null;
    });

    if (!loaded) return;

    // 최소 크기 검증 (77x77)
    if (loaded.width < 77 || loaded.height < 77) {
      setPreview(null);
      setImageError("사진이 너무 작습니다. (최소 77 * 77 px)");
      e.target.value = "";
      return;
    }

    // 중앙 기준 1:1 크롭 후 400x400 리사이즈
    const squareSize = Math.min(loaded.width, loaded.height);
    const sx = (loaded.width - squareSize) / 2;
    const sy = (loaded.height - squareSize) / 2;

    const canvas = document.createElement("canvas");
    const targetSize = 400;
    canvas.width = targetSize;
    canvas.height = targetSize;
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      setPreview(null);
      setImageError("이미지를 처리할 수 없습니다.");
      return;
    }

    ctx.drawImage(
      loaded.source,
      sx,
      sy,
      squareSize,
      squareSize,
      0,
      0,
      targetSize,
      targetSize,
    );

    const resizedDataUrl = canvas.toDataURL("image/jpeg", 0.92);

    setImageError(null);
    setPreview(resizedDataUrl);
    e.target.value = "";
  };

  const onSubmit = (data: SignupStep1Values) => {
    console.log("회원가입 Step1 데이터:", data);
    router.push("/signup/step2");
  };

  const handleRemoveImage = () => {
    setPreview(null);
    setImageError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  useEffect(() => {
    setIsNicknameVerified(false);
    setDuplicateError(null);
    setDuplicateSuccess(null);
  }, [nicknameValue]);

  const handleDuplicateCheck = async () => {
    setDuplicateError(null);
    setDuplicateSuccess(null);
    const isValid = await trigger("nickname");
    if (!isValid) {
      setIsNicknameVerified(false);
      setDuplicateError("닉네임 형식을 확인해주세요.");
      return;
    }
    setIsNicknameVerified(true);
    setDuplicateError(null);
    setDuplicateSuccess("사용 가능한 닉네임입니다.");
  };

  const isSubmitDisabled =
    !isNicknameVerified || !!errors.nickname || !nicknameValue?.length;

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="w-full max-w-[390px] min-h-[844px] mx-auto px-6 py-8"
    >
      {/* 상단 타이틀 */}
      <div className="text-center">
        <h1 className="text-lg font-semibold">가입하기</h1>
        <p className="mt-1 text-sm text-muted-foreground">일반 정보</p>
      </div>

      {/* 진행 바 */}
      <div className="mt-6 flex justify-center">
        <Progress value={50} className="w-3/4" />
      </div>

      {/* 프로필 이미지 */}
      <div className="mt-10 flex flex-col items-center">
        <div className="relative">
          <label className="relative flex h-48 w-48 cursor-pointer items-center justify-center rounded-full bg-muted overflow-hidden border border-[#121212]">
            {preview ? (
              <NextImage
                src={preview}
                alt="프로필 미리보기"
                fill
                className="object-cover"
              />
            ) : (
              <span className="text-4xl font-bold">+</span>
            )}

            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleImageChange}
            />
          </label>

          {/* ❌ 이미지 제거 버튼 */}
          {preview && (
            <button
              type="button"
              onClick={handleRemoveImage}
              aria-label="프로필 이미지 삭제"
              className="
      absolute
      top-2
      right-2
      h-8
      w-8
      rounded-full
      bg-white
      text-[#121212]
      border border-[#121212]
      flex
      items-center
      justify-center
      hover:bg-gray-100
      shadow
    "
            >
              ✕
            </button>
          )}
        </div>

        {imageError && (
          <p className="mt-2 text-[11px] text-red-500">{imageError}</p>
        )}
      </div>

      {/* 닉네임 */}
      <div className="mt-15">
        <label className="mb-1 block text-sm font-medium">
          닉네임<span className="text-red-500">*</span>
        </label>

        <p className="mb-2 text-xs text-muted-foreground">
          2자 이상 20자 이하, 특수문자(._)만 사용 가능
        </p>

        <div className="flex gap-2">
          <Input
            placeholder="닉네임을 입력해주세요."
            className="placeholder:text-[12px] text-[12px]"
            autoFocus
            {...register("nickname")}
          />
          <Button
            type="button"
            variant="outline"
            onClick={handleDuplicateCheck}
          >
            중복 확인
          </Button>
        </div>

        {errors.nickname && (
          <p className="mt-3 text-[11px] text-red-500">
            {errors.nickname.message}
          </p>
        )}

        {duplicateError && (
          <p className="mt-1 text-[11px] text-red-500">{duplicateError}</p>
        )}
        {duplicateSuccess && (
          <p className="mt-1 text-[11px] text-green-600">{duplicateSuccess}</p>
        )}
      </div>

      {/* 다음 버튼 */}
      <Button
        type="submit"
        disabled={isSubmitDisabled}
        className={`mt-40 h-14 w-full text-base font-semibold ${
          isSubmitDisabled
            ? "bg-gray-200 text-gray-500 hover:bg-gray-200"
            : "bg-black text-white hover:bg-black"
        }`}
      >
        다음
      </Button>
    </form>
  );
}
