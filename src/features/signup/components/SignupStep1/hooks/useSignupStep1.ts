"use client";

import { useCallback, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signupStep1Schema, type SignupStep1Values } from "../schema";
import { useNicknameHandlers } from "./useNicknameHandlers";

export function useSignupStep1() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hasHandledOAuth = useRef(false);

  /* -------------------------
     React Hook Form
  ------------------------- */
  const form = useForm<SignupStep1Values>({
    resolver: zodResolver(signupStep1Schema),
    mode: "onChange",
    defaultValues: { nickname: "" },
  });

  const { handleSubmit, trigger, control } = form;

  /* -------------------------
     OAuth 콜백 처리
  ------------------------- */
  useEffect(() => {
    if (hasHandledOAuth.current) return;

    const status = searchParams.get("status");
    if (!status) return;

    hasHandledOAuth.current = true;

    if (status === "ACTIVE") router.replace("/home");
    if (status === "PENDING") router.replace("/signup/step1");
  }, [router, searchParams]);

  /* -------------------------
     Nickname 비즈니스 로직
  ------------------------- */
  const {
    isNicknameVerified,
    duplicateError,
    duplicateSuccess,
    isChecking,
    handleDuplicateCheck,
  } = useNicknameHandlers(trigger, "nickname");

  /* -------------------------
     Submit 비즈니스 로직
  ------------------------- */
  const onSubmit = useCallback(
    async (data: SignupStep1Values) => {
      if (!isNicknameVerified) {
        const ok = await handleDuplicateCheck(data.nickname);
        if (!ok) return;
      }

      try {
        localStorage.setItem("signup-nickname", data.nickname);
      } catch {
        // ignore
      }

      router.replace("/signup/step2");
    },
    [router, isNicknameVerified, handleDuplicateCheck],
  );

  return {
    form,
    control,
    handleSubmit,
    onSubmit,

    // nickname business states
    isNicknameVerified,
    duplicateError,
    duplicateSuccess,
    isChecking,
    handleDuplicateCheck,
  };
}
