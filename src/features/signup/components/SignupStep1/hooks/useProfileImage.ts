import { useCallback, useState, type ChangeEvent } from "react";
const SIGNUP_PROFILE_IMAGE_DATA_KEY = "katopia.signupProfileImageData";

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
        const reader = new FileReader();
        const dataUrl = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error("이미지 읽기 실패"));
          reader.readAsDataURL(file);
        });

        try {
          window.localStorage.setItem(SIGNUP_PROFILE_IMAGE_DATA_KEY, dataUrl);
        } catch {
          // ignore storage errors
        }
        setPreview(dataUrl);
      } catch (err) {
        setImageError(
          err instanceof Error ? err.message : "이미지 처리 실패",
        );
      }
    },
    [],
  );

  const handleRemoveImage = useCallback(() => {
    setPreview(null);
    setImageError(null);
    try {
      window.localStorage.removeItem(SIGNUP_PROFILE_IMAGE_DATA_KEY);
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
