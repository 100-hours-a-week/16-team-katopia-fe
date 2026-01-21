import { useCallback, useState, type ChangeEvent } from "react";

export function useProfileImage() {
  const [preview, setPreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  const handleImageChange = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const url = URL.createObjectURL(file);
      setPreview(url);
      setImageError(null);
      e.target.value = "";
    },
    [],
  );

  const handleRemoveImage = useCallback(() => {
    setPreview(null);
    setImageError(null);
  }, []);

  return {
    preview,
    imageError,
    handleImageChange,
    handleRemoveImage,
  };
}
