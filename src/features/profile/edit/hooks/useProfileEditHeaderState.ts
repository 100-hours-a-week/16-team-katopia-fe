"use client";

import { useSyncExternalStore } from "react";
import { useFormContext, useFormState, useWatch } from "react-hook-form";

import type { ProfileEditFormValues } from "./useProfileEdit";

type HeaderSharedStateArgs = {
  imageBlob: Blob | null;
  removeImage: boolean;
  initialStyles: string[];
  subscribeStyles: (listener: () => void) => () => void;
  getStylesSnapshot: () => string[];
};

export const useHeaderBackState = ({
  imageBlob,
  removeImage,
}: Pick<HeaderSharedStateArgs, "imageBlob" | "removeImage">) => {
  const { control } = useFormContext<ProfileEditFormValues>();
  const { isDirty } = useFormState<ProfileEditFormValues>({
    control,
    name: ["nickname", "gender", "height", "weight"],
  });

  const hasChanges = Boolean(imageBlob) || removeImage || isDirty;

  return { hasChanges };
};

export const useHeaderSubmitState = ({
  imageBlob,
  removeImage,
  initialStyles,
  subscribeStyles,
  getStylesSnapshot,
}: HeaderSharedStateArgs) => {
  const { control } = useFormContext<ProfileEditFormValues>();
  const { isDirty } = useFormState<ProfileEditFormValues>({
    control,
    name: ["nickname", "gender", "height", "weight"],
  });
  const nickname = useWatch<ProfileEditFormValues>({ name: "nickname" }) ?? "";
  const gender = useWatch<ProfileEditFormValues>({ name: "gender" }) ?? "";
  const styles = useSyncExternalStore(
    subscribeStyles,
    getStylesSnapshot,
    getStylesSnapshot,
  );

  const normalizedStyles = [...styles].sort().join("|");
  const normalizedInitialStyles = [...initialStyles].sort().join("|");

  const hasRequiredValues =
    Boolean(String(nickname ?? "").trim()) && Boolean(gender);

  const hasChanges =
    Boolean(imageBlob) ||
    removeImage ||
    isDirty ||
    normalizedStyles !== normalizedInitialStyles;

  return { hasChanges, hasRequiredValues };
};
