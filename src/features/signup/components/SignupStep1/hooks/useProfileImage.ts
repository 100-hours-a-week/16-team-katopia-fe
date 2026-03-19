import { useCallback, useRef, useState, type ChangeEvent } from "react";
import { processImageFile } from "@/src/features/upload/utils/processImage";

let signupProfileImageBlob: Blob | null = null;

export function getSignupProfileImageBlob() {
  return signupProfileImageBlob;
}

export function setSignupProfileImageBlob(blob: Blob | null) {
  signupProfileImageBlob = blob;
}

export function clearSignupProfileImageBlob() {
  signupProfileImageBlob = null;
}

/* ===============================
 * Profile Image Hook
 * =============================== */
export function useProfileImage() {
  const [preview, setPreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const previewUrlRef = useRef<string | null>(null);

  const handleImageChange = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // 30MB 제한
      if (file.size > 30 * 1024 * 1024) {
        setImageError("최대 이미지 용량은 30MB입니다.");
        e.target.value = "";
        return;
      }

      try {
        const previewUrl = URL.createObjectURL(file);
        if (previewUrlRef.current) {
          URL.revokeObjectURL(previewUrlRef.current);
        }
        previewUrlRef.current = previewUrl;
        setPreview(previewUrl);
        setImageError(null);
        e.target.value = "";

        const { blob } = await processImageFile(file, {
          maxWidth: 1080,
          quality: 0.8,
          outputType: "image/webp",
          heicToJpegQuality: 0.9,
          heicErrorMessage:
            "HEIC 이미지를 처리할 수 없습니다. JPG 또는 PNG로 변환 후 업로드해주세요.",
        });
        setSignupProfileImageBlob(blob);

        const processedPreviewUrl = URL.createObjectURL(blob);
        if (previewUrlRef.current) {
          URL.revokeObjectURL(previewUrlRef.current);
        }
        previewUrlRef.current = processedPreviewUrl;
        setPreview(processedPreviewUrl);
      } catch (err) {
        if (previewUrlRef.current) {
          URL.revokeObjectURL(previewUrlRef.current);
          previewUrlRef.current = null;
        }
        setPreview(null);
        setImageError(err instanceof Error ? err.message : "이미지 처리 실패");
        setSignupProfileImageBlob(null);
      }
    },
    [],
  );

  const handleRemoveImage = useCallback(() => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    setPreview(null);
    setImageError(null);
    setSignupProfileImageBlob(null);
  }, []);

  return {
    preview,
    imageError,
    handleImageChange,
    handleRemoveImage,
  };
}
