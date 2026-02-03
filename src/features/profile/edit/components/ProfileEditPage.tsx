"use client";

import Image from "next/image";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";

import { updateProfile } from "@/src/features/profile/api/updateProfile";
import { API_BASE_URL } from "@/src/config/api";
import { authFetch } from "@/src/lib/auth";
import { useAuth } from "@/src/features/auth/providers/AuthProvider";
import { useNicknameHandlers } from "@/src/features/signup/components/SignupStep1/hooks/useNicknameHandlers";
import NicknameInput from "./NickNameInput";
import ProfileEditCancelModal from "./ProfileEditCancelModal";
import BodyInfoSection from "@/src/features/signup/components/SignupStep2/BodyInfoSection";
import { resolveMediaUrl } from "@/src/features/profile/utils/resolveMediaUrl";
import {
  requestUploadPresign,
  uploadToPresignedUrl,
} from "@/src/features/upload/api/presignUpload";
import heic2any from "heic2any";

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

      if (!/^[a-zA-Z0-9._\p{Script=Hangul}]+$/u.test(value)) {
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
  const { ready, isAuthenticated } = useAuth(); // 🔥 핵심

  /* ---------- State ---------- */
  const [preview, setPreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [imageBlob, setImageBlob] = useState<Blob | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [heightError, setHeightError] = useState<string | null>(null);
  const [weightError, setWeightError] = useState<string | null>(null);

  const [styleError, setStyleError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [initialNickname, setInitialNickname] = useState<string | null>(null);
  const [initialGender, setInitialGender] = useState<"MALE" | "FEMALE">("MALE");
  const [initialHeight, setInitialHeight] = useState<string>("");
  const [initialWeight, setInitialWeight] = useState<string>("");
  const [initialStyles, setInitialStyles] = useState<string[]>([]);
  const [currentProfileImageObjectKey, setCurrentProfileImageObjectKey] =
    useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const redirectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const previewUrlRef = useRef<string | null>(null);
  const weightInputRef = useRef<HTMLInputElement | null>(null);

  /* ---------- Form ---------- */
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    reset,
    formState: { errors, isDirty },
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
  const heightValue = watch("height") ?? "";
  const weightValue = watch("weight") ?? "";
  const trimmedNickname = nickname?.trim();
  const canCheckDuplicate =
    Boolean(trimmedNickname) && trimmedNickname !== initialNickname;

  /* ---------- Nickname Duplicate Logic ---------- */
  const {
    isNicknameVerified,
    duplicateError,
    duplicateSuccess,
    isChecking,
    handleNicknameChangeCapture,
    handleDuplicateCheck,
  } = useNicknameHandlers<FormValues>(trigger, "nickname");

  /* =========================
     🔥 기존 프로필 불러오기
     (토큰 준비된 뒤 실행)
  ========================= */

  useEffect(() => {
    if (!ready || !isAuthenticated) return;

    const fetchProfile = async () => {
      try {
        const res = await authFetch(`${API_BASE_URL}/api/members/me`, {
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
          enableRealtimeNotification:
            profile.enableRealtimeNotification ?? true,
          styles:
            profile.style?.map((s: string) => ENUM_TO_STYLE[s] ?? s) ?? [],
        });

        setInitialNickname(profile.nickname ?? null);
        setInitialGender(profile.gender === "F" ? "FEMALE" : "MALE");
        setInitialHeight(profile.height ? String(profile.height) : "");
        setInitialWeight(profile.weight ? String(profile.weight) : "");
        setInitialStyles(
          profile.style?.map((s: string) => ENUM_TO_STYLE[s] ?? s) ?? [],
        );
        const profileImageKey =
          profile.profileImageObjectKey ?? profile.profileImageUrl ?? null;
        setCurrentProfileImageObjectKey(profileImageKey);
        setPreview(resolveMediaUrl(profileImageKey ?? undefined));
        setRemoveImage(false);
      } catch {
        // ignore (handled by auth guard)
      }
    };

    fetchProfile();
  }, [ready, isAuthenticated, reset]);

  useEffect(() => {
    if (!ready) return;
    if (!isAuthenticated) {
      router.replace("/home");
    }
  }, [ready, isAuthenticated, router]);

  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current);
      }
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const showToast = (message: string, durationMs = 2000) => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setToastMessage(message);
    toastTimerRef.current = setTimeout(() => {
      setToastMessage(null);
    }, durationMs);
  };

  /* =========================
     Submit
  ========================= */

  const onSubmit = async (data: FormValues) => {
    const trimmedNickname = data.nickname?.trim();
    const isNicknameChanged =
      trimmedNickname && trimmedNickname !== initialNickname;

    if (isNicknameChanged && !isNicknameVerified) {
      showToast("닉네임 중복 확인이 필요합니다.");
      return;
    }

    try {
      let uploadedProfileObjectKey: string | undefined;

      if (!removeImage && imageBlob) {
        const [presigned] = await requestUploadPresign("PROFILE", ["webp"]);
        await uploadToPresignedUrl(
          presigned.uploadUrl,
          imageBlob,
          "image/webp",
        );
        uploadedProfileObjectKey = presigned.imageObjectKey.replace(/^\/+/, "");
        setCurrentProfileImageObjectKey(uploadedProfileObjectKey);
        setPreview(resolveMediaUrl(uploadedProfileObjectKey));
      }

      const profileImageObjectKey = removeImage
        ? null
        : uploadedProfileObjectKey
          ? uploadedProfileObjectKey
          : (currentProfileImageObjectKey ?? undefined);

      await updateProfile({
        nickname: trimmedNickname || undefined,
        profileImageObjectKey,
        gender: data.gender === "MALE" ? "M" : "F",
        height: data.height ? Number(data.height) : null,
        weight: data.weight ? Number(data.weight) : null,
        enableRealtimeNotification: data.enableRealtimeNotification ?? true,
        style: data.styles.map((s) => STYLE_TO_ENUM[s]),
      });

      // 🔥 캐시 무효화 → 마이프로필 즉시 반영
      queryClient.invalidateQueries({ queryKey: ["me"] });

      showToast("수정이 완료되었습니다.");
      redirectTimerRef.current = setTimeout(
        () => router.push("/profile"),
        1500,
      );
    } catch (e) {
      showToast(e instanceof Error ? e.message : "프로필 수정에 실패했습니다.");
    }
  };

  /* ---------- Utils ---------- */

  const sanitizeNumericInput = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 3);
    if (!digits) return "";
    const num = Number(digits);
    return String(Math.min(num, 300));
  };

  const handleNumericChange = (field: "height" | "weight", raw: string) => {
    const sanitized = sanitizeNumericInput(raw);
    setValue(field, sanitized);
    if (!sanitized) {
      if (field === "height") setHeightError(null);
      if (field === "weight") setWeightError(null);
      return;
    }
    const parsed = parseInt(sanitized, 10);
    if (field === "height") {
      if (parsed < 100 || parsed > 300) {
        setHeightError("키는 100~300 사이로 입력해주세요.");
      } else {
        setHeightError(null);
      }
    } else {
      if (parsed < 20 || parsed > 300) {
        setWeightError("몸무게는 20~300 사이로 입력해주세요.");
      } else {
        setWeightError(null);
      }
    }
  };

  const handleImageChange = (file: File) => {
    if (file.size > 30 * 1024 * 1024) {
      setImageError("사진 크기가 너무 큽니다. (최대 30MB)");
      return;
    }

    const resizeAndCompress = async (
      target: File,
      maxWidth = 1080,
      quality = 0.8,
    ): Promise<Blob> => {
      let sourceFile = target;

      const lowerName = target.name.toLowerCase();
      if (
        target.type === "image/heic" ||
        target.type === "image/heif" ||
        lowerName.endsWith(".heic") ||
        lowerName.endsWith(".heif")
      ) {
        const buffer = await target.arrayBuffer();
        const heicBlob = new Blob([buffer], {
          type: target.type || "image/heic",
        });
        const converted = await heic2any({
          blob: heicBlob,
          toType: "image/jpeg",
          quality: 0.9,
        });

        const jpegBlob = Array.isArray(converted) ? converted[0] : converted;

        const safeName = target.name.replace(/\.heic$|\.heif$/i, ".jpg");
        sourceFile = new File([jpegBlob], safeName, { type: "image/jpeg" });
      }

      const bitmap = await createImageBitmap(sourceFile, {
        imageOrientation: "from-image",
      });

      const scale = Math.min(1, maxWidth / bitmap.width);
      const canvas = document.createElement("canvas");
      canvas.width = bitmap.width * scale;
      canvas.height = bitmap.height * scale;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        throw new Error("이미지 처리 실패");
      }
      ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

      return new Promise((resolve, reject) =>
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("이미지 변환 실패"));
              return;
            }
            resolve(blob);
          },
          "image/webp",
          quality,
        ),
      );
    };

    setImageError(null);
    setRemoveImage(false);
    setImageBlob(null);

    const localUrl = URL.createObjectURL(file);
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
    }
    previewUrlRef.current = localUrl;
    setPreview(localUrl);

    resizeAndCompress(file)
      .then((blob) => {
        setImageBlob(blob);
        const processedUrl = URL.createObjectURL(blob);
        if (previewUrlRef.current) {
          URL.revokeObjectURL(previewUrlRef.current);
        }
        previewUrlRef.current = processedUrl;
        setPreview(processedUrl);
      })
      .catch((err) => {
        if (previewUrlRef.current) {
          URL.revokeObjectURL(previewUrlRef.current);
          previewUrlRef.current = null;
        }
        setPreview(null);
        setImageError(err instanceof Error ? err.message : "이미지 처리 실패");
      });
  };

  const handleRemoveImage = () => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    setPreview(null);
    setImageBlob(null);
    setRemoveImage(true);
    setCurrentProfileImageObjectKey(null);
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

  if (!ready || !isAuthenticated) {
    return null;
  }

  const normalizedStyles = [...styles].sort().join("|");
  const normalizedInitialStyles = [...initialStyles].sort().join("|");
  const hasChanges =
    Boolean(imageBlob) ||
    removeImage ||
    (trimmedNickname ?? "") !== (initialNickname ?? "") ||
    selectedGender !== initialGender ||
    (heightValue ?? "") !== (initialHeight ?? "") ||
    (weightValue ?? "") !== (initialWeight ?? "") ||
    normalizedStyles !== normalizedInitialStyles ||
    isDirty;

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="min-h-screen bg-white">
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-3">
          <button
            type="button"
            aria-label="뒤로가기"
            onClick={() => {
              if (hasChanges) {
                setShowCancelModal(true);
                return;
              }
              router.back();
            }}
          >
            <Image
              src="/icons/back.svg"
              alt="뒤로가기"
              width={24}
              height={24}
            />
          </button>
          <h1 className="text-[14px] font-semibold">프로필 수정</h1>
          <button
            type="submit"
            disabled={!hasChanges}
            className={`text-[14px] font-semibold ${
              hasChanges ? "text-black" : "text-gray-300"
            }`}
          >
            완료
          </button>
        </header>

        {/* Image */}
        <div className="flex flex-col items-center py-6">
          <div
            className="relative flex h-40 w-40 cursor-pointer items-center justify-center rounded-full bg-gray-200"
            onClick={() => fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
          >
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview}
                alt=""
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              <span className="text-4xl">+</span>
            )}
            {preview && (
              <button
                type="button"
                aria-label="프로필 이미지 삭제"
                className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-white text-lg font-semibold text-black shadow transition-colors hover:bg-gray-100"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleRemoveImage();
                  if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                  }
                }}
              >
                ×
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              hidden
              accept="image/*"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleImageChange(e.target.files[0]);
                }
                e.target.value = "";
              }}
            />
          </div>
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
            disableDuplicateCheck={!canCheckDuplicate || isChecking}
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
        <section className="px-4">
          <BodyInfoSection
            heightValue={heightValue}
            weightValue={weightValue}
            onHeightChange={(value) => handleNumericChange("height", value)}
            onWeightChange={(value) => handleNumericChange("weight", value)}
            weightInputRef={weightInputRef}
            heightError={heightError}
            weightError={weightError}
          />
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
          <div className="fixed bottom-25 left-1/2 z-100 -translate-x-1/2 px-4">
            <div
              className="min-w-65 rounded-full border border-black bg-gray-100 px-8 py-3 text-center text-base font-semibold text-black shadow-lg"
              style={{ animation: "toastFadeIn 250ms ease-out forwards" }}
            >
              {toastMessage}
            </div>
          </div>
        )}
      </form>

      <ProfileEditCancelModal
        open={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={() => router.back()}
      />

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
