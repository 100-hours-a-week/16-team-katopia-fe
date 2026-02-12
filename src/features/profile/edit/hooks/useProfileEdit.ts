"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import heic2any from "heic2any";

import { updateProfile } from "@/src/features/profile/api/updateProfile";
import { API_BASE_URL } from "@/src/config/api";
import { authFetch } from "@/src/lib/auth";
import { useAuth } from "@/src/features/auth/providers/AuthProvider";
import { useNicknameHandlers } from "@/src/features/signup/components/SignupStep1/hooks/useNicknameHandlers";
import { resolveMediaUrl } from "@/src/features/profile/utils/resolveMediaUrl";
import {
  requestUploadPresign,
  uploadToPresignedUrl,
} from "@/src/features/upload/api/presignUpload";

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

const schema = z.object({
  nickname: z
    .string()
    .trim()
    .optional()
    .superRefine((value, ctx) => {
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
  height: z
    .string()
    .optional()
    .refine(
      (value) => {
        if (!value) return true;
        const parsed = parseInt(value, 10);
        return parsed >= 100 && parsed <= 300;
      },
      { message: "키는 100~300 사이로 입력해주세요." },
    ),
  weight: z
    .string()
    .optional()
    .refine(
      (value) => {
        if (!value) return true;
        const parsed = parseInt(value, 10);
        return parsed >= 20 && parsed <= 300;
      },
      { message: "몸무게는 20~300 사이로 입력해주세요." },
    ),
  enableRealtimeNotification: z.boolean().optional(),
});

export type ProfileEditFormValues = z.infer<typeof schema>;

export function useProfileEdit() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { ready, isAuthenticated } = useAuth();

  const [preview, setPreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [imageBlob, setImageBlob] = useState<Blob | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [initialNickname, setInitialNickname] = useState<string | null>(null);
  const [initialStyles, setInitialStyles] = useState<string[]>([]);
  const [currentProfileImageObjectKey, setCurrentProfileImageObjectKey] =
    useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const stylesRef = useRef<string[]>([]);
  const styleErrorTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const redirectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);
  const previewUrlRef = useRef<string | null>(null);

  const form = useForm<ProfileEditFormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      nickname: "",
      gender: "MALE",
      height: "",
      weight: "",
      enableRealtimeNotification: true,
    },
  });

  const {
    verifiedNickname,
    duplicateError,
    duplicateSuccess,
    isChecking,
    handleDuplicateCheck: handleDuplicateCheckBase,
  } = useNicknameHandlers<ProfileEditFormValues>(form.trigger, "nickname");

  const handleDuplicateCheck = useCallback(
    (value: string) => {
      const trimmed = value.trim();
      if (!trimmed) return false;
      return handleDuplicateCheckBase(trimmed);
    },
    [handleDuplicateCheckBase],
  );

  const setStylesRef = useCallback((next: string[]) => {
    stylesRef.current = next;
  }, []);

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

        const nextStyles =
          profile.style?.map(
            (style: string) => ENUM_TO_STYLE[style] ?? style,
          ) ?? [];

        form.reset({
          nickname: profile.nickname ?? "",
          gender: profile.gender === "F" ? "FEMALE" : "MALE",
          height: profile.height ? String(profile.height) : "",
          weight: profile.weight ? String(profile.weight) : "",
          enableRealtimeNotification:
            profile.enableRealtimeNotification ?? true,
        });

        setInitialNickname(profile.nickname ?? null);
        setInitialStyles(nextStyles);
        setStylesRef(nextStyles);

        const profileImageKey =
          profile.profileImageObjectKey ?? profile.profileImageUrl ?? null;
        setCurrentProfileImageObjectKey(profileImageKey);
        setPreview(resolveMediaUrl(profileImageKey ?? undefined));
        setRemoveImage(false);
        setImageBlob(null);
      } catch {
        // ignore (handled by auth guard)
      }
    };

    fetchProfile();
  }, [ready, isAuthenticated, form, setStylesRef]);

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
      if (styleErrorTimeoutRef.current) {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        clearTimeout(styleErrorTimeoutRef.current);
      }
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }
    };
  }, []);

  const showToast = useCallback((message: string, durationMs = 2000) => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setToastMessage(message);
    toastTimerRef.current = setTimeout(() => {
      setToastMessage(null);
    }, durationMs);
  }, []);

  const resizeAndCompress = useCallback(
    async (target: File, maxWidth = 1080, quality = 0.8): Promise<Blob> => {
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
    },
    [],
  );

  const handleImageChange = useCallback(
    (file: File) => {
      if (file.size > 30 * 1024 * 1024) {
        setImageError("사진 크기가 너무 큽니다. (최대 30MB)");
        return;
      }

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
          setImageError(
            err instanceof Error ? err.message : "이미지 처리 실패",
          );
        });
    },
    [resizeAndCompress],
  );

  const handleRemoveImage = useCallback(() => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    setPreview(null);
    setImageBlob(null);
    setRemoveImage(true);
    setCurrentProfileImageObjectKey(null);
  }, []);

  const onSubmit = useCallback(
    async (data: ProfileEditFormValues) => {
      const nextNickname = data.nickname?.trim();
      const isNicknameChanged =
        nextNickname && nextNickname !== (initialNickname ?? "");
      const isNicknameVerified =
        Boolean(nextNickname) && verifiedNickname === nextNickname;

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
          uploadedProfileObjectKey = presigned.imageObjectKey.replace(
            /^\/+/,
            "",
          );
          setCurrentProfileImageObjectKey(uploadedProfileObjectKey);
          setPreview(resolveMediaUrl(uploadedProfileObjectKey));
        }

        const shouldRemoveImage = removeImage;
        const shouldSendEmpty =
          shouldRemoveImage && !data.height && !data.weight;
        const profileImageObjectKey = shouldSendEmpty
          ? ""
          : shouldRemoveImage
            ? ""
            : (uploadedProfileObjectKey ??
              currentProfileImageObjectKey ??
              null);

        await updateProfile({
          nickname: nextNickname || undefined,
          profileImageObjectKey,
          gender: data.gender === "MALE" ? "M" : "F",
          height: data.height ? Number(data.height) : "",
          weight: data.weight ? Number(data.weight) : "",
          enableRealtimeNotification: data.enableRealtimeNotification ?? true,
          style: stylesRef.current.map(
            (style) => STYLE_TO_ENUM[style] ?? style,
          ),
        });

        queryClient.invalidateQueries({ queryKey: ["me"] });

        showToast("수정이 완료되었습니다.");
        redirectTimerRef.current = setTimeout(
          () => router.push("/profile"),
          1500,
        );
      } catch (err) {
        showToast(
          err instanceof Error ? err.message : "프로필 수정에 실패했습니다.",
        );
      }
    },
    [
      initialNickname,
      verifiedNickname,
      showToast,
      removeImage,
      imageBlob,
      currentProfileImageObjectKey,
      queryClient,
      router,
    ],
  );

  const handleConfirmCancel = useCallback(() => {
    router.back();
  }, [router]);

  return {
    ready,
    isAuthenticated,
    form,
    onSubmit,
    onBackImmediate: () => router.back(),
    handleConfirmCancel,
    showCancelModal,
    setShowCancelModal,
    preview,
    imageError,
    handleImageChange,
    handleRemoveImage,
    duplicateError,
    duplicateSuccess,
    isChecking,
    handleDuplicateCheck,
    toastMessage,
    stylesRef,
    setStylesRef,
    styleErrorTimeoutRef,
    initialStyles,
    initialNickname,
    imageBlob,
    removeImage,
  };
}
