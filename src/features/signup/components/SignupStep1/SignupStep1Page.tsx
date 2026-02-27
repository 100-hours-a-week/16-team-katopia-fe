"use client";

import Header from "./Header";
import ProfileImageUploader from "./ProfileImageUploader";
import NicknameField from "./NicknameField";
import SubmitButton from "./SubmitButton";
import { useProfileImage } from "./hooks/useProfileImage";
import { useSignupStep1 } from "./hooks/useSignupStep1";

export default function SignupStep1() {
  const {
    control,
    handleSubmit,
    onSubmit,
    verifiedNickname,
    duplicateError,
    duplicateSuccess,
    isChecking,
    handleDuplicateCheck,
  } = useSignupStep1();

  const { preview, imageError, handleImageChange, handleRemoveImage } =
    useProfileImage();

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="w-full max-w-[430px] min-h-211 mx-auto px-6 py-8"
    >
      <Header />

      <ProfileImageUploader
        preview={preview}
        error={imageError}
        onChange={handleImageChange}
        onRemove={handleRemoveImage}
      />

      <NicknameField
        control={control}
        duplicateError={duplicateError}
        duplicateSuccess={duplicateSuccess}
        onDuplicateCheck={handleDuplicateCheck}
        isChecking={isChecking}
        disableDuplicateCheck={verifiedNickname !== ""} // ✅ 검증 완료 후 비활성화
      />

      <SubmitButton control={control} verifiedNickname={verifiedNickname} />
    </form>
  );
}
