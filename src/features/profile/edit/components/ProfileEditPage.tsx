"use client";

import type { ChangeEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { useQueryClient } from "@tanstack/react-query";

import { updateProfile } from "@/src/features/profile/api/updateProfile";
import { API_BASE_URL } from "@/src/config/api";
import { getAccessToken } from "@/src/lib/auth";
import { useAuth } from "@/src/features/auth/providers/AuthProvider";
import { useNicknameHandlers } from "@/src/features/signup/components/SignupStep1/hooks/useNicknameHandlers";
import NicknameInput from "./NickNameInput";
import {
  getCachedProfileImage,
  isRemoteUrl,
  setCachedProfileImage,
} from "@/src/features/profile/utils/profileImageCache";

/* =========================
   Constants
========================= */

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

const STYLE_TO_ENUM: Record<string, string> = {
  미니멀: "MINIMAL",
  페미닌: "FEMININE",
  시크모던: "CHIC_MODERN",
  러블리: "LOVELY",
  빈티지: "VINTAGE",
  캐주얼: "CASUAL",
  스트릿: "STREET",
  클래식: "CLASSIC",
  스포티: "SPORTY",
  Y2K: "Y2K",
};

const ENUM_TO_STYLE: Record<string, string> = Object.fromEntries(
  Object.entries(STYLE_TO_ENUM).map(([k, v]) => [v, k]),
);

/* =========================
   Schema
========================= */

const schema = z.object({
  nickname: z
    .string()
    .trim()
    .optional()
    .superRefine((value, ctx) => {
      // ✅ 수정 안 한 경우 → 검증 패스
      if (!value || value.length === 0) return;

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

      if (/^[ㄱ-ㅎㅏ-ㅣ]+$/.test(value)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "자음/모음만으로는 닉네임을 만들 수 없습니다.",
        });
      }

      if (!/^[a-zA-Z0-9._가-힣]+$/.test(value)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "특수문자는 ( . _ ) 만 사용할 수 있습니다.",
        });
      }
    }),

  gender: z.enum(["MALE", "FEMALE"]),
  height: z.string().optional(),
  weight: z.string().optional(),
  enableRealtimeNotification: z.boolean().optional(),
  styles: z.array(z.string()).max(2),
});

type FormValues = z.infer<typeof schema>;

export default function ProfileEditPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { ready } = useAuth(); // 🔥 핵심

  /* ---------- State ---------- */
  const [preview, setPreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [styleError, setStyleError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [initialNickname, setInitialNickname] = useState<string | null>(null);

  const redirectTimerRef = useRef<NodeJS.Timeout | null>(null);

  /* ---------- Form ---------- */
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      nickname: "",
      gender: "MALE",
      height: "",
      weight: "",
      enableRealtimeNotification: true,
      styles: [],
    },
  });

  // eslint-disable-next-line react-hooks/incompatible-library
  const nickname = watch("nickname");
  const styles = watch("styles");
  const selectedGender = watch("gender");

  /* ---------- Nickname Duplicate Logic ---------- */
  const {
    isNicknameVerified,
    duplicateError,
    duplicateSuccess,
    handleNicknameChangeCapture,
    handleDuplicateCheck,
  } = useNicknameHandlers<FormValues>(trigger, "nickname");

  /* =========================
     🔥 기존 프로필 불러오기
     (토큰 준비된 뒤 실행)
  ========================= */

  useEffect(() => {
    if (!ready) return;

    const fetchProfile = async () => {
      const token = getAccessToken();
      if (!token) return;

      // console.log("Fetched token:", token);

      const res = await fetch(`${API_BASE_URL}/api/members/me`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      });

      if (!res.ok) return;

      const json = await res.json();
      const profile = json.data.profile;

      // console.log("Fetched profile:", profile);

      reset({
        nickname: profile.nickname ?? "",
        gender: profile.gender === "F" ? "FEMALE" : "MALE",
        height: profile.height ? String(profile.height) : "",
        weight: profile.weight ? String(profile.weight) : "",
        enableRealtimeNotification: profile.enableRealtimeNotification ?? true,
        styles: profile.style?.map((s: string) => ENUM_TO_STYLE[s] ?? s) ?? [],
      });

      setInitialNickname(profile.nickname ?? null);
      if (profile.profileImageUrl) {
        setCachedProfileImage(profile.profileImageUrl);
      }
      const cachedImage = getCachedProfileImage();
      setPreview(profile.profileImageUrl ?? cachedImage);
    };

    fetchProfile();
  }, [ready, reset]);

  /* =========================
     Submit
  ========================= */

  const onSubmit = async (data: FormValues) => {
    const trimmedNickname = data.nickname?.trim();
    const isNicknameChanged =
      trimmedNickname && trimmedNickname !== initialNickname;

    if (isNicknameChanged && !isNicknameVerified) {
      setToastMessage("닉네임 중복 확인이 필요합니다.");
      return;
    }

    try {
      const profileImageUrl =
        preview && isRemoteUrl(preview) ? preview : undefined;

      await updateProfile({
        nickname: trimmedNickname || undefined,
        profileImageUrl, // 🔥 이미 업로드된 URL만 전송
        gender: data.gender === "MALE" ? "M" : "F",
        height: data.height ? Number(data.height) : null,
        weight: data.weight ? Number(data.weight) : null,
        enableRealtimeNotification: data.enableRealtimeNotification ?? true,
        style: data.styles.map((s) => STYLE_TO_ENUM[s]),
      });

      // 🔥 캐시 무효화 → 마이프로필 즉시 반영
      queryClient.invalidateQueries({ queryKey: ["me"] });

      setToastMessage("수정이 완료되었습니다.");
      redirectTimerRef.current = setTimeout(
        () => router.push("/profile"),
        1500,
      );
    } catch (e) {
      setToastMessage(
        e instanceof Error ? e.message : "프로필 수정에 실패했습니다.",
      );
    }
  };

  /* ---------- Utils ---------- */

  const sanitizeNumericInput = (value: string) =>
    value.replace(/\D/g, "").slice(0, 3);

  const handleNumericChange = (
    e: ChangeEvent<HTMLInputElement>,
    field: "height" | "weight",
  ) => {
    const sanitized = sanitizeNumericInput(e.target.value);
    e.target.value = sanitized;
    setValue(field, sanitized);
  };

  const handleImageChange = (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      setImageError("사진 크기가 너무 큽니다. (최대 5MB)");
      return;
    }

    const resizeToDataUrl = (target: File) =>
      new Promise<string>((resolve, reject) => {
        const img = new window.Image();
        const objectUrl = URL.createObjectURL(target);

        img.onload = () => {
          const side = 256;
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            URL.revokeObjectURL(objectUrl);
            reject(new Error("이미지 처리 실패"));
            return;
          }

          const min = Math.min(img.width, img.height);
          const sx = (img.width - min) / 2;
          const sy = (img.height - min) / 2;

          canvas.width = side;
          canvas.height = side;
          ctx.drawImage(img, sx, sy, min, min, 0, 0, side, side);
          URL.revokeObjectURL(objectUrl);

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error("이미지 변환 실패"));
                return;
              }
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.onerror = () => reject(new Error("이미지 읽기 실패"));
              reader.readAsDataURL(blob);
            },
            "image/jpeg",
            0.85,
          );
        };

        img.onerror = () => {
          URL.revokeObjectURL(objectUrl);
          reject(new Error("이미지 로드 실패"));
        };

        img.src = objectUrl;
      });

    setImageFile(file); // 🔥 핵심
    setImageError(null);
    resizeToDataUrl(file)
      .then((dataUrl) => {
        setPreview(dataUrl);
        setCachedProfileImage(dataUrl);
      })
      .catch((err) => {
        setImageError(err instanceof Error ? err.message : "이미지 처리 실패");
      });
  };

  const onToggle = (style: string) => {
    if (styles.includes(style)) {
      setValue(
        "styles",
        styles.filter((s) => s !== style),
      );
      return;
    }
    if (styles.length >= 2) {
      setStyleError("선호 스타일은 최대 2개 선택 가능합니다.");
      return;
    }
    setValue("styles", [...styles, style]);
    setStyleError(null);
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
            onDuplicateCheck={() => {
              if (!nickname) return;
              handleDuplicateCheck(nickname); // 🔥 반드시 nickname 전달
            }}
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
