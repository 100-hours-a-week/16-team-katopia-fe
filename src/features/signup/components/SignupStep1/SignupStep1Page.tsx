"use client";

import { useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import Header from "./Header";
import ProfileImageUploader from "./ProfileImageUploader";
import NicknameField from "./NicknameField";
import SubmitButton from "./SubmitButton";

import { useProfileImage } from "./hooks/useProfileImage";
import { useNicknameHandlers } from "./hooks/useNicknameHandlers";

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

export default function SignupStep1() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors },
  } = useForm<SignupStep1Values>({
    resolver: zodResolver(signupStep1Schema),
    mode: "onChange",
  });

  const { preview, imageError, handleImageChange, handleRemoveImage } =
    useProfileImage();

  const {
    isNicknameVerified,
    hasNicknameValue,
    duplicateError,
    duplicateSuccess,
    handleNicknameChangeCapture,
    handleDuplicateCheck,
  } = useNicknameHandlers(trigger);

  const onSubmit = useCallback(
    (data: SignupStep1Values) => {
      console.log("Signup Step1:", data);
      router.push("/signup/step2");
    },
    [router],
  );

  const isSubmitDisabled = useMemo(
    () => !isNicknameVerified || !!errors.nickname || !hasNicknameValue,
    [isNicknameVerified, errors.nickname, hasNicknameValue],
  );

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
