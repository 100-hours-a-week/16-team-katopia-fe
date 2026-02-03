import { useCallback, useRef, useState, type ChangeEvent } from "react";
import heic2any from "heic2any";

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
 * 이미지 리사이징 + WebP 압축
 * (HEIC 처리 ❌, JPEG/PNG만 처리)
 * =============================== */
async function resizeAndCompress(
  file: File,
  maxWidth = 1080,
  quality = 0.8,
): Promise<Blob> {
  const bitmap = await createImageBitmap(file, {
    imageOrientation: "from-image", // EXIF 회전 반영
  });

  const scale = Math.min(1, maxWidth / bitmap.width);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);

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
        let sourceForPreview: Blob = file;
        let sourceForResize: File = file;

        /* ===============================
         * HEIC → JPEG 변환 (여기서만!)
         * =============================== */
        if (
          file.type === "image/heic" ||
          file.name.toLowerCase().endsWith(".heic")
        ) {
          try {
            const buffer = await file.arrayBuffer(); // ⭐ 핵심

            const blob = new Blob([buffer], { type: file.type });
            const converted = await heic2any({
              blob, // ✅ Blob 타입
              toType: "image/jpeg",
              quality: 0.9,
            });

            const jpegBlob = Array.isArray(converted)
              ? converted[0]
              : converted;

            sourceForPreview = jpegBlob;
            sourceForResize = new File(
              [jpegBlob],
              file.name.replace(/\.heic$/i, ".jpg"),
              { type: "image/jpeg" },
            );
          } catch {
            throw new Error(
              "HEIC 이미지를 처리할 수 없습니다. JPG 또는 PNG로 변환 후 업로드해주세요.",
            );
          }
        }

        /* ===============================
         * Preview URL 생성
         * =============================== */
        const previewUrl = URL.createObjectURL(sourceForPreview);
        if (previewUrlRef.current) {
          URL.revokeObjectURL(previewUrlRef.current);
        }
        previewUrlRef.current = previewUrl;
        setPreview(previewUrl);
        setImageError(null);
        e.target.value = "";

        /* ===============================
         * 리사이징 + 업로드
         * =============================== */
        const blob = await resizeAndCompress(sourceForResize);
        setSignupProfileImageBlob(blob);
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
