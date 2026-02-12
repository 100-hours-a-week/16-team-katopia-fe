"use client";

import { memo } from "react";
import { useFormContext } from "react-hook-form";

import NicknameField from "@/src/features/signup/components/SignupStep1/NicknameField";
import type { ProfileEditFormValues } from "../../hooks/useProfileEdit";

type NicknameSectionProps = {
  duplicateError: string | null;
  duplicateSuccess: string | null;
  onDuplicateCheck: (nickname: string) => boolean | Promise<boolean>;
  isChecking: boolean;
  initialNickname: string | null;
};

const NicknameSection = memo(
  ({
    duplicateError,
    duplicateSuccess,
    onDuplicateCheck,
    isChecking,
    initialNickname,
  }: NicknameSectionProps) => {
    const { control } = useFormContext<ProfileEditFormValues>();

    return (
      <section className="px-4">
        <NicknameField
          control={control}
          duplicateError={duplicateError}
          duplicateSuccess={duplicateSuccess}
          onDuplicateCheck={onDuplicateCheck}
          isChecking={isChecking}
          initialNickname={initialNickname}
        />
      </section>
    );
  },
);

NicknameSection.displayName = "NicknameSection";

export default NicknameSection;
