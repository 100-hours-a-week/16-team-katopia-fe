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
     OAuth 콜백 처리 (status 분기만)
  ------------------------- */
  useEffect(() => {
    if (hasHandledOAuth.current) return;

    const status = searchParams.get("status");
    if (!status) return;

    hasHandledOAuth.current = true;

    if (status === "ACTIVE") {
      router.replace("/home");
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
    isChecking,
    handleNicknameChangeCapture,
    handleDuplicateCheck,
  } = useNicknameHandlers(trigger, "nickname");

  /* -------------------------
     Submit (닉네임 저장 → Step2)
  ------------------------- */
  const onSubmit = useCallback(
    async (data: SignupStep1Values) => {
      try {
        if (!isNicknameVerified) {
          const ok = await handleDuplicateCheck(data.nickname);
          if (!ok) return;
        }

        try {
          window.localStorage.setItem("signup-nickname", data.nickname);
        } catch {
          // ignore storage errors and still proceed
        }

        // Step2에서 gender까지 포함해 회원가입을 완료합니다.
        router.replace("/signup/step2");
      } catch (err) {
        console.error(err);
        alert("회원가입 중 오류가 발생했습니다.");
      }
    },
    [router, isNicknameVerified, handleDuplicateCheck],
  );

  /* -------------------------
     Submit Button Disabled
  ------------------------- */
  const isSubmitDisabled = useMemo(
    () =>
      !!errors.nickname ||
      !hasNicknameValue ||
      !isNicknameVerified ||
      !duplicateSuccess,
    [errors.nickname, hasNicknameValue, isNicknameVerified, duplicateSuccess],
  );

  /* -------------------------
     Render
  ------------------------- */
  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="w-full max-w-97.5 min-h-211 mx-auto px-6 py-8"
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
        disableDuplicateCheck={!nickname || isChecking}
      />

      <SubmitButton disabled={isSubmitDisabled} />
    </form>
  );
}
