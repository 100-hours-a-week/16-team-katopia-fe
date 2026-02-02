import { useCallback, useRef, useState, type ChangeEvent } from "react";
import heic2any from "heic2any";
import {
  requestUploadPresign,
  uploadToPresignedUrl,
} from "@/src/features/upload/api/presignUpload";

const SIGNUP_PROFILE_IMAGE_DATA_KEY = "katopia.signupProfileImageData";

async function resizeAndCompress(
  file: File,
  maxWidth = 1080,
  quality = 0.8,
): Promise<Blob> {
  let sourceFile = file;

  if (file.type === "image/heic" || file.name.toLowerCase().endsWith(".heic")) {
    const converted = await heic2any({
      blob: file,
      toType: "image/jpeg",
      quality: 0.9,
    });

    const jpegBlob = Array.isArray(converted) ? converted[0] : converted;

    sourceFile = new File([jpegBlob], file.name.replace(/\.heic$/i, ".jpg"), {
      type: "image/jpeg",
    });
  }

  const bitmap = await createImageBitmap(sourceFile, {
    imageOrientation: "from-image",
  });

  const scale = Math.min(1, maxWidth / bitmap.width);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width * scale;
  canvas.height = bitmap.height * scale;

  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

  return new Promise((resolve) =>
    canvas.toBlob(
      (blob) => {
        if (!blob) throw new Error("이미지 압축 실패");
        resolve(blob);
      },
      "image/webp",
      quality,
    ),
  );
}

export function useProfileImage() {
  const [preview, setPreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const previewUrlRef = useRef<string | null>(null);

  const handleImageChange = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (file.size > 30 * 1024 * 1024) {
        setImageError("최대 이미지 용량은 30MB입니다.");
        e.target.value = "";
        return;
      }

      try {
        let sourceForPreview: Blob = file;
        let sourceForResize: File = file;

        if (
          file.type === "image/heic" ||
          file.name.toLowerCase().endsWith(".heic")
        ) {
          const converted = await heic2any({
            blob: file,
            toType: "image/jpeg",
            quality: 0.9,
          });
          const jpegBlob = Array.isArray(converted) ? converted[0] : converted;
          sourceForPreview = jpegBlob;
          sourceForResize = new File(
            [jpegBlob],
            file.name.replace(/\.heic$/i, ".jpg"),
            { type: "image/jpeg" },
          );
        }

        const previewUrl = URL.createObjectURL(sourceForPreview);
        if (previewUrlRef.current) {
          URL.revokeObjectURL(previewUrlRef.current);
        }
        previewUrlRef.current = previewUrl;
        setPreview(previewUrl);
        setImageError(null);
        e.target.value = "";

        const blob = await resizeAndCompress(sourceForResize);
        const [presigned] = await requestUploadPresign("PROFILE", ["webp"]);
        await uploadToPresignedUrl(presigned.uploadUrl, blob, "image/webp");
        const objectKey = presigned.imageObjectKey.replace(/^\/+/, "");
        try {
          window.localStorage.setItem(
            SIGNUP_PROFILE_IMAGE_DATA_KEY,
            objectKey,
          );
        } catch {
          // ignore storage errors
        }
      } catch (err) {
        if (previewUrlRef.current) {
          URL.revokeObjectURL(previewUrlRef.current);
          previewUrlRef.current = null;
        }
        setPreview(null);
        setImageError(
          err instanceof Error ? err.message : "이미지 처리 실패",
        );
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
