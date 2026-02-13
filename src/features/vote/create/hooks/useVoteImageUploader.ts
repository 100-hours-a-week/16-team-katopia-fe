"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import {
  PointerSensor,
  TouchSensor,
  type DragEndEvent,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import heic2any from "heic2any";
import {
  requestUploadPresign,
  uploadToPresignedUrl,
} from "@/src/features/upload/api/presignUpload";

const MAX_FILES = 5;
const MAX_FILE_SIZE = 30 * 1024 * 1024;
const ACCEPT = "image/*";
const ALLOWED_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".heic",
  ".heif",
  ".gif",
  ".svg",
]);

type PreviewItem = {
  id: string;
  url: string;
  name: string;
  objectKey: string;
};

const getExtension = (name: string) => {
  const idx = name.lastIndexOf(".");
  return idx >= 0 ? name.slice(idx).toLowerCase() : "";
};

const isSupportedImageFile = (file: File) => {
  const ext = getExtension(file.name);
  if (file.type && !file.type.startsWith("image/")) return false;
  if (ext && !ALLOWED_EXTENSIONS.has(ext)) return false;
  if (!file.type && ext) return ALLOWED_EXTENSIONS.has(ext);
  return true;
};

type EncodedImage = {
  blob: Blob;
  contentType: string;
  extension: string;
};

async function resizeAndCompress(
  file: File,
  maxLongSide = 1440,
): Promise<EncodedImage> {
  let sourceFile = file;
  const isHeicLike =
    file.type === "image/heic" ||
    file.type === "image/heif" ||
    file.name.toLowerCase().endsWith(".heic") ||
    file.name.toLowerCase().endsWith(".heif");
  if (isHeicLike) {
    try {
      const buffer = await file.arrayBuffer();
      const heicBlob = new Blob([buffer], {
        type: file.type || "image/heic",
      });
      const converted = await heic2any({
        blob: heicBlob,
        toType: "image/jpeg",
        quality: 0.92,
      });

      const jpegBlob = Array.isArray(converted) ? converted[0] : converted;
      const safeName = file.name.replace(/\.heic$|\.heif$/i, ".jpg");
      sourceFile = new File([jpegBlob], safeName, { type: "image/jpeg" });
    } catch {
      throw new Error(
        "HEIC 파일은 업로드할 수 없습니다. JPG/PNG로 변환해주세요.",
      );
    }
  }

  const bitmap = await createImageBitmap(sourceFile, {
    imageOrientation: "from-image",
  });

  const scale = Math.min(
    1,
    maxLongSide / Math.max(bitmap.width, bitmap.height),
  );
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width * scale;
  canvas.height = bitmap.height * scale;

  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

  const blob = await new Promise<Blob>((resolve) =>
    canvas.toBlob(
      (result) => {
        if (!result) throw new Error("이미지 압축 실패");
        resolve(result);
      },
      "image/webp",
      0.92,
    ),
  );

  return {
    blob,
    contentType: "image/webp",
    extension: "webp",
  };
}

export function useVoteImageUploader() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [inputKey, setInputKey] = useState(0);
  const [previews, setPreviews] = useState<PreviewItem[]>([]);
  const [helperText, setHelperText] = useState<string | null>(null);
  const previewsRef = useRef<PreviewItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const previewIds = useMemo(() => previews.map((p) => p.id), [previews]);

  useEffect(() => {
    previewsRef.current = previews;
  }, [previews]);

  useEffect(() => {
    return () => {
      previewsRef.current.forEach((item) => URL.revokeObjectURL(item.url));
    };
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 5 },
    }),
  );

  const resetInput = useCallback(() => {
    setInputKey((prev) => prev + 1);
  }, []);

  const handleAddClick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const handleRemoveAt = useCallback((index: number) => {
    setPreviews((prev) => {
      const target = prev[index];
      if (target) {
        URL.revokeObjectURL(target.url);
      }
      return prev.filter((_, idx) => idx !== index);
    });
  }, []);

  const handleDragEnd = useCallback(({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const activeId = String(active.id);
    const overId = String(over.id);

    setPreviews((prev) => {
      const oldIndex = prev.findIndex((p) => p.id === activeId);
      const newIndex = prev.findIndex((p) => p.id === overId);
      if (oldIndex < 0 || newIndex < 0) return prev;
      return arrayMove(prev, oldIndex, newIndex);
    });
  }, []);

  const handleFileChange = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []);
      if (!files.length) return;
      setHelperText(null);

      const remain = MAX_FILES - previews.length;
      if (remain <= 0) {
        setHelperText("최대 5장까지 업로드할 수 있습니다.");
        resetInput();
        return;
      }

      const selected = files.slice(0, remain);

      const hasUnsupported = selected.some(
        (file) => !isSupportedImageFile(file),
      );
      const hasOversize = selected.some((file) => file.size > MAX_FILE_SIZE);
      if (hasOversize || hasUnsupported) {
        const message = hasOversize
          ? "이미지 용량은 최대 30MB까지 가능합니다."
          : "지원하지 않는 이미지 형식입니다.";
        setHelperText(message);
      }

      const validSelected = selected.filter(
        (file) => file.size <= MAX_FILE_SIZE && isSupportedImageFile(file),
      );
      if (validSelected.length === 0) {
        resetInput();
        return;
      }

      const tempItems: PreviewItem[] = validSelected.map((file) => {
        const id = crypto.randomUUID();
        return {
          id,
          url: URL.createObjectURL(file),
          name: file.name,
          objectKey: `pending:${id}`,
        };
      });

      try {
        setPreviews((prev) => [...prev, ...tempItems]);
        setIsUploading(true);

        const encoded = await Promise.all(
          validSelected.map((file) => resizeAndCompress(file)),
        );

        const presigned = await requestUploadPresign(
          "VOTE",
          encoded.map((item) => item.extension),
        );

        await Promise.all(
          presigned.map((p, i) =>
            uploadToPresignedUrl(
              p.uploadUrl,
              encoded[i].blob,
              encoded[i].contentType,
            ),
          ),
        );

        const tempToReal = new Map(
          presigned.map((p, i) => [
            tempItems[i].objectKey,
            p.imageObjectKey.replace(/^\/+/, ""),
          ]),
        );

        setPreviews((prev) =>
          prev.map((item) => ({
            ...item,
            objectKey: tempToReal.get(item.objectKey) ?? item.objectKey,
          })),
        );

        setHelperText(null);
      } catch (err) {
        tempItems.forEach((i) => URL.revokeObjectURL(i.url));
        setPreviews((prev) =>
          prev.filter((p) => !tempItems.some((t) => t.id === p.id)),
        );

        setHelperText(
          err instanceof Error ? err.message : "이미지 업로드에 실패했습니다.",
        );
      } finally {
        setIsUploading(false);
        resetInput();
      }
    },
    [previews.length, resetInput],
  );

  return {
    inputRef,
    inputKey,
    previews,
    previewIds,
    sensors,
    helperText,
    isUploading,
    canAdd: previews.length < MAX_FILES,
    handleAddClick,
    handleRemoveAt,
    handleDragEnd,
    handleFileChange,
  };
}

export type { PreviewItem };
export { ACCEPT, MAX_FILES };
