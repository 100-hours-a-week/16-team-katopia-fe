import { useCallback, useState, type ChangeEvent } from "react";
import {
  requestUploadPresign,
  uploadToPresignedUrl,
} from "@/src/features/upload/api/presignUpload";
import { getFileExtension } from "@/src/features/upload/utils/getFileExtension";

const SIGNUP_PROFILE_IMAGE_KEY = "katopia.signupProfileImageUrl";

export function useProfileImage() {
  const [preview, setPreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  const handleImageChange = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const localUrl = URL.createObjectURL(file);
      setPreview(localUrl);
      setImageError(null);
      e.target.value = "";

      try {
        const extension = getFileExtension(file);
        if (!extension) {
          throw new Error("지원하지 않는 이미지 확장자입니다.");
        }

        const [presigned] = await requestUploadPresign("PROFILE", [extension]);
        await uploadToPresignedUrl(presigned.uploadUrl, file, file.type);
        try {
          window.localStorage.setItem(
            SIGNUP_PROFILE_IMAGE_KEY,
            presigned.accessUrl,
          );
        } catch {
          // ignore storage errors
        }
        setPreview(presigned.accessUrl);
      } catch (err) {
        setImageError(
          err instanceof Error ? err.message : "이미지 업로드 실패",
        );
      }
    },
    [],
  );

  const handleRemoveImage = useCallback(() => {
    setPreview(null);
    setImageError(null);
    try {
      window.localStorage.removeItem(SIGNUP_PROFILE_IMAGE_KEY);
    } catch {
      // ignore storage errors
    }
  }, []);

  return {
    preview,
    imageError,
    handleImageChange,
    handleRemoveImage,
  };
}
