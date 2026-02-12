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

const MAX_FILES = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MIN_WIDTH = 300;
const MIN_HEIGHT = 400;
const ACCEPT = "image/jpeg,image/png,image/heic,image/heif";
const ALLOWED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".heic"]);

type PreviewItem = {
  id: string;
  url: string;
  originalName: string;
  internalName: string;
  blob: Blob;
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

const buildInternalName = () => `${crypto.randomUUID()}.jpg`;

async function loadImageBitmap(file: File) {
  return createImageBitmap(file, { imageOrientation: "from-image" });
}

async function normalizeHeic(file: File): Promise<File> {
  const isHeicLike =
    file.type === "image/heic" ||
    file.type === "image/heif" ||
    file.name.toLowerCase().endsWith(".heic") ||
    file.name.toLowerCase().endsWith(".heif");

  if (!isHeicLike) return file;

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
  return new File([jpegBlob], safeName, { type: "image/jpeg" });
}

function cropToThreeFour(bitmap: ImageBitmap) {
  const targetRatio = 3 / 4;
  const currentRatio = bitmap.width / bitmap.height;
  let sx = 0;
  let sy = 0;
  let sw = bitmap.width;
  let sh = bitmap.height;

  if (currentRatio > targetRatio) {
    sw = Math.round(bitmap.height * targetRatio);
    sx = Math.round((bitmap.width - sw) / 2);
  } else if (currentRatio < targetRatio) {
    sh = Math.round(bitmap.width / targetRatio);
    sy = Math.round((bitmap.height - sh) / 2);
  }

  return { sx, sy, sw, sh };
}

async function processImage(file: File): Promise<Blob> {
  const normalized = await normalizeHeic(file);
  const bitmap = await loadImageBitmap(normalized);

  if (bitmap.width < MIN_WIDTH || bitmap.height < MIN_HEIGHT) {
    throw new Error("사진이 너무 작습니다. (최소 300x400 px)");
  }

  const { sx, sy, sw, sh } = cropToThreeFour(bitmap);
  const targetWidth = 1080;
  const targetHeight = 1440;
  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("이미지 처리에 실패했습니다.");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, targetWidth, targetHeight);

  const blob = await new Promise<Blob>((resolve) =>
    canvas.toBlob(
      (result) => {
        if (!result) throw new Error("이미지 처리에 실패했습니다.");
        resolve(result);
      },
      "image/jpeg",
      0.92,
    ),
  );

  return blob;
}

export function useVoteImageUploader() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [inputKey, setInputKey] = useState(0);
  const [previews, setPreviews] = useState<PreviewItem[]>([]);
  const [helperText, setHelperText] = useState<string | null>(null);
  const previewsRef = useRef<PreviewItem[]>([]);

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

  const handleDragEnd = useCallback(
    ({ active, over }: DragEndEvent) => {
      if (!over || active.id === over.id) return;
      const activeId = String(active.id);
      const overId = String(over.id);
      const oldIndex = previews.findIndex((p) => p.id === activeId);
      const newIndex = previews.findIndex((p) => p.id === overId);
      if (oldIndex < 0 || newIndex < 0) return;
      setPreviews((p) => arrayMove(p, oldIndex, newIndex));
    },
    [previews],
  );

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
      if (hasUnsupported) {
        setHelperText(
          "지원하지 않는 확장자 입니다.(JPG, JPEG, PNG, HEIC만 가능합니다.)",
        );
      }

      const hasOversize = selected.some((file) => file.size > MAX_FILE_SIZE);
      if (hasOversize) {
        setHelperText("사진 크기가 너무 큽니다. (최대 10MB)");
      }

      const validSelected = selected.filter(
        (file) => file.size <= MAX_FILE_SIZE && isSupportedImageFile(file),
      );
      if (validSelected.length === 0) {
        resetInput();
        return;
      }

      try {
        const processed = await Promise.all(
          validSelected.map(async (file) => {
            const blob = await processImage(file);
            const id = crypto.randomUUID();
            return {
              id,
              blob,
              originalName: file.name,
              internalName: buildInternalName(),
              url: URL.createObjectURL(blob),
            };
          }),
        );

        setPreviews((prev) => [...prev, ...processed]);
        setHelperText(null);
      } catch (err) {
        setHelperText(
          err instanceof Error ? err.message : "사진 업로드를 실패했습니다",
        );
      } finally {
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
    canAdd: previews.length < MAX_FILES,
    handleAddClick,
    handleRemoveAt,
    handleDragEnd,
    handleFileChange,
  };
}

export type { PreviewItem };
export { ACCEPT, MAX_FILES };
