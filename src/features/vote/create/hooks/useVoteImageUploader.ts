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
import {
  requestUploadPresign,
  uploadToPresignedUrl,
} from "@/src/features/upload/api/presignUpload";
import { processImageFile } from "@/src/features/upload/utils/processImage";

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

      const remain = MAX_FILES - previewsRef.current.length;
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
          validSelected.map((file) =>
            processImageFile(file, {
              maxLongSide: 1440,
              quality: 0.92,
              outputType: "image/webp",
              heicToJpegQuality: 0.92,
              heicErrorMessage:
                "HEIC 파일은 업로드할 수 없습니다. JPG/PNG로 변환해주세요.",
            }),
          ),
        );

        const presigned = await requestUploadPresign(
          "VOTE",
          encoded.map((item) => item.extension),
        );

        if (presigned.length !== encoded.length) {
          throw new Error("업로드 URL 개수가 이미지 수와 일치하지 않습니다.");
        }

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

        const unresolved = tempItems.some(
          (item) => !tempToReal.has(item.objectKey),
        );
        if (unresolved) {
          throw new Error("일부 이미지 업로드를 완료하지 못했습니다.");
        }

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
    [resetInput],
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
