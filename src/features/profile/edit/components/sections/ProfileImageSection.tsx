"use client";

import { memo, useCallback } from "react";

import ProfileImageUploader from "@/src/features/signup/components/SignupStep1/ProfileImageUploader";

type ProfileImageSectionProps = {
  preview: string | null;
  imageError: string | null;
  onImageChange: (file: File) => void;
  onRemoveImage: () => void;
};

const ProfileImageSection = memo(
  ({
    preview,
    imageError,
    onImageChange,
    onRemoveImage,
  }: ProfileImageSectionProps) => {
    const handleImageInputChange = useCallback(
      (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        onImageChange(file);
        event.target.value = "";
      },
      [onImageChange],
    );

    return (
      <div className="px-4">
        <ProfileImageUploader
          preview={preview}
          error={imageError}
          onChange={handleImageInputChange}
          onRemove={onRemoveImage}
        />
      </div>
    );
  },
);

ProfileImageSection.displayName = "ProfileImageSection";

export default ProfileImageSection;
