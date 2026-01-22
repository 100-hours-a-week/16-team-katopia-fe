"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import Header from "./Header";
import ProfileImageUploader from "./ProfileImageUploader";
import NicknameField from "./NicknameField";
import SubmitButton from "./SubmitButton";

import { useProfileImage } from "./hooks/useProfileImage";
import { useNicknameHandlers } from "./hooks/useNicknameHandlers";
import { setAccessToken } from "@/src/lib/auth";
import { API_BASE_URL } from "@/src/config/api";

/* =========================
   Schema & Types
========================= */

const signupStep1Schema = z.object({
  nickname: z
    .string()
    .min(2, "닉네임은 최소 2자 이상, 최대 20자 이하만 가능합니다.")
    .max(20, "닉네임은 최소 2자 이상, 최대 20자 이하만 가능합니다.")
    .regex(/^\S+$/, "공백은 입력할 수 없습니다")
    .regex(
      /^[a-zA-Z0-9가-힣ㄱ-ㅎㅏ-ㅣ._]+$/,
      "특수문자는 '_' 또는 '.'만 허용됩니다.",
    ),
});

type SignupStep1Values = z.infer<typeof signupStep1Schema>;

/* =========================
   Component
========================= */

export default function SignupStep1() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hasHandledOAuth = useRef(false);

  /* -------------------------
     OAuth 콜백 처리
  ------------------------- */
  useEffect(() => {
    if (hasHandledOAuth.current) return;

    const status = searchParams.get("status");
    const accessToken = searchParams.get("accessToken");

    if (!status || !accessToken) return;

    hasHandledOAuth.current = true;
    setAccessToken(accessToken);

    if (status === "ACTIVE") {
      router.replace("/home");
      return;
    }

    if (status === "PENDING") {
      router.replace("/signup/step1");
    }
  }, [router, searchParams]);

  /* -------------------------
     React Hook Form
  ------------------------- */
  const {
    register,
    handleSubmit,
    trigger,
    watch,
    formState: { errors },
  } = useForm<SignupStep1Values>({
    resolver: zodResolver(signupStep1Schema),
    mode: "onChange",
    defaultValues: {
      nickname: "",
    },
  });

  const nickname = watch("nickname");

  /* -------------------------
     Profile Image
  ------------------------- */
  const { preview, imageError, handleImageChange, handleRemoveImage } =
    useProfileImage();

  /* -------------------------
     Nickname Logic
  ------------------------- */
  const {
    isNicknameVerified,
    hasNicknameValue,
    duplicateError,
    duplicateSuccess,
    handleNicknameChangeCapture,
    handleDuplicateCheck,
  } = useNicknameHandlers(trigger);

  /* -------------------------
     Submit (회원가입 API)
  ------------------------- */
  const onSubmit = useCallback(
    async (data: SignupStep1Values) => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/members`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include", // Refresh Token 쿠키 자동 포함
          body: JSON.stringify({
            nickname: data.nickname,
          }),
        });

        if (!res.ok) {
          throw new Error(`회원가입 실패 (${res.status})`);
        }

        // ✅ 회원가입 성공 → Step2 이동
        router.push("/signup/step2");
      } catch (err) {
        console.error(err);
        alert("회원가입 중 오류가 발생했습니다.");
      }
    },
    [router],
  );

  /* -------------------------
     Submit Button Disabled
  ------------------------- */
  const isSubmitDisabled = useMemo(
    () => !isNicknameVerified || !!errors.nickname || !hasNicknameValue,
    [isNicknameVerified, errors.nickname, hasNicknameValue],
  );

  /* -------------------------
     Render
  ------------------------- */
  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="w-full max-w-[390px] min-h-[844px] mx-auto px-6 py-8"
    >
      <Header />

      <ProfileImageUploader
        preview={preview}
        error={imageError}
        onChange={handleImageChange}
        onRemove={handleRemoveImage}
      />

      <NicknameField
        register={register("nickname")}
        nickname={nickname}
        onChangeCapture={handleNicknameChangeCapture}
        error={errors.nickname?.message}
        duplicateError={duplicateError}
        duplicateSuccess={duplicateSuccess}
        onDuplicateCheck={handleDuplicateCheck}
      />

      <SubmitButton disabled={isSubmitDisabled} />
    </form>
  );
}
