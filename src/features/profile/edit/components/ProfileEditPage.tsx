"use client";

import type { ChangeEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";

import NicknameInput from "./NickNameInput";

const STYLE_OPTIONS = [
  "미니멀",
  "페미닌",
  "시크모던",
  "러블리",
  "빈티지",
  "캐주얼",
  "스트릿",
  "클래식",
  "스포티",
  "Y2K",
];

const schema = z.object({
  nickname: z
    .string()
    .trim()
    .optional()
    .superRefine((value, ctx) => {
      if (!value) return;

      if (value.length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "닉네임은 2자 이상이어야 합니다.",
        });
      }

      if (value.length > 20) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "닉네임은 20자 이하여야 합니다.",
        });
      }

      if (!/^[a-zA-Z0-9._가-힣]+$/.test(value)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "사용할 수 없는 문자가 포함되어 있습니다.",
        });
      }
    }),
  gender: z.enum(["MALE", "FEMALE"]),
  height: z.string().optional(),
  weight: z.string().optional(),
  styles: z.array(z.string()).max(2),
});

type FormValues = z.infer<typeof schema>;

export default function ProfileEditPage() {
  const [imageError, setImageError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  // ✅ 닉네임 중복 관련 상태
  const [duplicateError, setDuplicateError] = useState<string | null>(null);
  const [duplicateSuccess, setDuplicateSuccess] = useState<string | null>(null);

  // 선호 스타일 에러
  const [styleError, setStyleError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);
  const redirectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  const sanitizeNumericInput = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 3);
    if (!digits) return "";
    return String(parseInt(digits, 10));
  };

  const handleNumericChange = (
    e: ChangeEvent<HTMLInputElement>,
    field: "height" | "weight",
  ) => {
    const sanitized = sanitizeNumericInput(e.target.value);
    e.target.value = sanitized;
    setValue(field, sanitized, { shouldDirty: true });
  };

  // 스타일 에러 자동 숨김
  useEffect(() => {
    if (!styleError) return;

    const timer = setTimeout(() => setStyleError(null), 3000);
    return () => clearTimeout(timer);
  }, [styleError]);

  // 토스트 타이머 클린업
  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current);
    };
  }, []);

  const showToast = (message: string) => {
    setToastMessage(message);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToastMessage(null), 2500);
  };

  const onToggle = (style: string) => {
    // 이미 선택된 경우 → 제거
    if (styles.includes(style)) {
      const next = styles.filter((s) => s !== style);
      setValue("styles", next);
      setStyleError(null);
      return;
    }

    // 최대 2개 초과 방지
    if (styles.length >= 2) {
      setStyleError("선호 스타일은 최대 2개까지 선택할 수 있습니다.");
      return;
    }

    // 정상 추가
    setValue("styles", [...styles, style]);
    setStyleError(null);
  };

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      styles: [],
      gender: "MALE",
    },
  });

  const styles = watch("styles");
  const nickname = watch("nickname");
  const selectedGender = watch("gender");

  /* ---------------- 닉네임 로직 ---------------- */

  // 닉네임 변경 시 중복 메시지 초기화
  const handleNicknameChangeCapture = () => {
    setDuplicateError(null);
    setDuplicateSuccess(null);
  };

  // 중복 확인
  const handleDuplicateCheck = async () => {
    if (!nickname?.trim()) {
      setDuplicateError("닉네임 입력 후 확인해주세요.");
      setDuplicateSuccess(null);
      return;
    }

    const isValid = await trigger("nickname");
    if (!isValid) {
      setDuplicateSuccess(null);
      return;
    }

    // TODO: 실제 API로 교체
    const isDuplicated = nickname === "admin";

    if (isDuplicated) {
      setDuplicateError("이미 사용중인 닉네임입니다.");
      setDuplicateSuccess(null);
    } else {
      setDuplicateSuccess("사용 가능한 닉네임입니다.");
      setDuplicateError(null);
    }
  };

  /* ------------------------------------------------ */

  const onSubmit = (data: FormValues) => {
    const trimmedNickname = nickname?.trim();

    if (trimmedNickname && !duplicateSuccess) {
      setDuplicateError("닉네임 중복 확인이 필요합니다.");
      return;
    }

    console.log(data);
    // API 연결
    showToast("수정이 완료되었습니다.");
    if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current);
    redirectTimerRef.current = setTimeout(() => router.push("/profile"), 2500);
  };

  const handleImageChange = (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      setImageError("사진 크기가 너무 큽니다. (최대 5MB)");
      return;
    }
    setImageError(null);
    setPreview(URL.createObjectURL(file));
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="min-h-screen bg-white">
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-3">
          <button
            type="button"
            aria-label="뒤로가기"
            onClick={() => router.back()}
          >
            <Image
              src="/icons/back.svg"
              alt="뒤로가기"
              width={24}
              height={24}
            />
          </button>
          <h1 className="font-semibold">프로필 수정</h1>
          <button type="submit" className="font-semibold">
            완료
          </button>
        </header>

        {/* Image */}
        <div className="flex flex-col items-center py-6">
          <label className="relative flex h-40 w-40 cursor-pointer items-center justify-center rounded-full bg-gray-200">
            {preview ? (
              <Image
                src={preview}
                alt=""
                fill
                className="rounded-full object-cover"
              />
            ) : (
              <span className="text-4xl">+</span>
            )}
            <input
              type="file"
              hidden
              accept="image/*"
              onChange={(e) =>
                e.target.files && handleImageChange(e.target.files[0])
              }
            />
          </label>
          {imageError && (
            <p className="mt-2 text-sm text-red-500">{imageError}</p>
          )}
        </div>

        {/* ✅ Nickname (공용 컴포넌트 사용) */}
        <section className="px-4">
          <NicknameInput
            register={register("nickname")}
            onChangeCapture={handleNicknameChangeCapture}
            error={errors.nickname?.message}
            duplicateError={duplicateError}
            duplicateSuccess={duplicateSuccess}
            onDuplicateCheck={handleDuplicateCheck}
          />
        </section>

        {/* Gender */}
        <section className="px-4 py-3 text-center">
          <div className="mt-4 flex justify-center gap-10">
            <label
              className={`relative inline-flex cursor-pointer items-center justify-center rounded-full border px-5 py-3 text-sm font-medium transition-colors ${
                selectedGender === "MALE"
                  ? "border-black bg-black text-white"
                  : "border-gray-300 text-gray-700"
              }`}
            >
              <input
                type="radio"
                value="MALE"
                {...register("gender")}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              />
              남성
            </label>
            <label
              className={`relative inline-flex cursor-pointer items-center justify-center rounded-full border px-5 py-3 text-sm font-medium transition-colors ${
                selectedGender === "FEMALE"
                  ? "border-black bg-black text-white"
                  : "border-gray-300 text-gray-700"
              }`}
            >
              <input
                type="radio"
                value="FEMALE"
                {...register("gender")}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              />
              여성
            </label>
          </div>
        </section>

        {/* Height / Weight */}
        <section className="flex px-4">
          <div className="mx-auto mt-6 flex items-center justify-center gap-12">
            {/* 키 */}
            <div>
              <label className="mb-1 block text-[13px] font-medium">키</label>
              <div className="inline-flex items-center gap-2">
                <Input
                  {...register("height")}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="예: 176"
                  className="w-[80px] text-right text-[13px]
          placeholder:text-right
          placeholder:text-[13px]
          placeholder:text-[#d9d9d9]"
                  onChange={(e) => handleNumericChange(e, "height")}
                />
                <span className="text-sm text-muted-foreground">cm</span>
              </div>
            </div>

            {/* 몸무게 */}
            <div>
              <label className="mb-1 block text-[13px] font-medium">
                몸무게
              </label>
              <div className="inline-flex items-center gap-2">
                <Input
                  {...register("weight")}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="예: 68"
                  className="w-[80px] text-right text-[13px]
          placeholder:text-right
          placeholder:text-[13px]
          placeholder:text-[#d9d9d9]"
                  onChange={(e) => handleNumericChange(e, "weight")}
                />
                <span className="text-sm text-muted-foreground">kg</span>
              </div>
            </div>
          </div>
        </section>

        {/* Styles */}
        <section className="px-4 py-8">
          <div className="mt-6">
            {/* Header */}
            <div className="mb-2 flex justify-between">
              <label className="font-semibold text-[13px]">선호 스타일</label>
              <span className="text-[12px] text-gray-400">
                선호 스타일은 최대 2개 선택 가능합니다.
              </span>
            </div>

            {/* Style Buttons */}
            <div className="grid grid-cols-5 gap-2">
              {STYLE_OPTIONS.map((style) => (
                <button
                  key={style}
                  type="button"
                  onClick={() => onToggle(style)}
                  className={`
          h-10 px-2 text-[12px]
          border rounded-[5px] whitespace-nowrap
          flex items-center justify-center
          ${
            styles.includes(style)
              ? "border-black bg-black text-white"
              : "border-gray-300 text-black"
          }
        `}
                >
                  {style}
                </button>
              ))}
            </div>

            {/* Error */}
            {styleError && (
              <p className="mt-2 text-[11px] text-red-500">{styleError}</p>
            )}
          </div>
        </section>

        {/* Toast */}
        {toastMessage && (
          <div className="fixed bottom-25 left-1/2 z-[100] -translate-x-1/2 px-4">
            <div
              className="min-w-[260px] rounded-full border border-black bg-gray-100 px-8 py-3 text-center text-base font-semibold text-black shadow-lg"
              style={{ animation: "toastFadeIn 250ms ease-out forwards" }}
            >
              {toastMessage}
            </div>
          </div>
        )}
      </form>

      <style jsx global>{`
        @keyframes toastFadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
}
