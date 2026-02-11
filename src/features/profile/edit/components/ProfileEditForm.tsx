"use client";

import { useMemo } from "react";
import type { MutableRefObject } from "react";
import { FormProvider, type UseFormReturn } from "react-hook-form";

import type { ProfileEditFormValues } from "../hooks/useProfileEdit";
import { useStyleStore } from "../hooks/useStyleStore";
import BodyInfoSectionBlock from "./sections/BodyInfoSectionBlock";
import GenderSectionBlock from "./sections/GenderSectionBlock";
import ProfileEditHeader from "./sections/ProfileEditHeader";
import ProfileImageSection from "./sections/ProfileImageSection";
import NicknameSection from "./sections/NicknameSection";
import StyleSectionBlock from "./sections/StyleSectionBlock";
import Toast from "./sections/Toast";
import ProfileEditView from "./ProfileEditView";

type Props = {
  form: UseFormReturn<ProfileEditFormValues>;
  onSubmit: (values: ProfileEditFormValues) => void | Promise<void>;
  onBackImmediate: () => void;
  setShowCancelModal: (next: boolean) => void;
  preview: string | null;
  imageError: string | null;
  onImageChange: (file: File) => void;
  onRemoveImage: () => void;
  duplicateError: string | null;
  duplicateSuccess: string | null;
  isChecking: boolean;
  onDuplicateCheck: (nickname: string) => boolean | Promise<boolean>;
  toastMessage: string | null;
  setStylesRef: (next: string[]) => void;
  styleErrorTimeoutRef: MutableRefObject<NodeJS.Timeout | null>;
  initialStyles: string[];
  initialNickname: string | null;
  imageBlob: Blob | null;
  removeImage: boolean;
};

export default function ProfileEditForm({
  form,
  onSubmit,
  onBackImmediate,
  setShowCancelModal,
  preview,
  imageError,
  onImageChange,
  onRemoveImage,
  duplicateError,
  duplicateSuccess,
  isChecking,
  onDuplicateCheck,
  toastMessage,
  setStylesRef,
  styleErrorTimeoutRef,
  initialStyles,
  initialNickname,
  imageBlob,
  removeImage,
}: Props) {
  const handleSubmit = useMemo(
    () => form.handleSubmit(onSubmit),
    [form, onSubmit],
  );

  const { getStylesSnapshot, subscribeStyles, setStylesSnapshot } =
    useStyleStore(initialStyles);

  return (
    <FormProvider {...form}>
      <ProfileEditView
        onSubmit={handleSubmit}
        header={
          <ProfileEditHeader
            onBackImmediate={onBackImmediate}
            setShowCancelModal={setShowCancelModal}
            imageBlob={imageBlob}
            removeImage={removeImage}
            initialStyles={initialStyles}
            subscribeStyles={subscribeStyles}
            getStylesSnapshot={getStylesSnapshot}
          />
        }
        profileImage={
          <ProfileImageSection
            preview={preview}
            imageError={imageError}
            onImageChange={onImageChange}
            onRemoveImage={onRemoveImage}
          />
        }
        nickname={
          <NicknameSection
            duplicateError={duplicateError}
            duplicateSuccess={duplicateSuccess}
            onDuplicateCheck={onDuplicateCheck}
            isChecking={isChecking}
            initialNickname={initialNickname}
          />
        }
        gender={<GenderSectionBlock />}
        bodyInfo={<BodyInfoSectionBlock />}
        style={
          <StyleSectionBlock
            initialStyles={initialStyles}
            setStylesRef={setStylesRef}
            styleErrorTimeoutRef={styleErrorTimeoutRef}
            setStylesSnapshot={setStylesSnapshot}
          />
        }
        toast={<Toast message={toastMessage} />}
      />
    </FormProvider>
  );
}
