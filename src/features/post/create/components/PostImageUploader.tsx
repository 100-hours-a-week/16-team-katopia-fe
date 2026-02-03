"use client";

import Image from "next/image";
import { useId, useMemo, useRef, useState } from "react";
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import heic2any from "heic2any";
import { Controller, useFormContext } from "react-hook-form";

import {
  requestUploadPresign,
  uploadToPresignedUrl,
} from "@/src/features/upload/api/presignUpload";

const MAX_FILES = 3;
const ACCEPT = "image/*";
const MAX_FILE_SIZE = 30 * 1024 * 1024;
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

function SortablePreview({
  item,
  onRemove,
}: {
  item: PreviewItem;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: item.id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      {...attributes}
      {...listeners}
      className="relative h-[60vh] w-88.75 shrink-0 rounded-xl overflow-hidden bg-gray-200"
    >
      {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
      <img src={item.url} className="h-full w-full object-cover" />

      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onRemove();
        }}
        className="absolute right-2 top-2 bg-white rounded-full p-1"
      >
        <Image src="/icons/delete.svg" alt="" width={28} height={28} />
      </button>
    </div>
  );
}

/* ---------------- 이미지 리사이징/압축 ---------------- */
async function resizeAndCompress(
  file: File,
  maxWidth = 1080,
  quality = 0.8,
): Promise<Blob> {
  let sourceFile = file;
  // ✅ HEIC/HEIF → JPEG 변환
  const lowerName = file.name.toLowerCase();
  if (
    file.type === "image/heic" ||
    file.type === "image/heif" ||
    lowerName.endsWith(".heic") ||
    lowerName.endsWith(".heif")
  ) {
    const buffer = await file.arrayBuffer();
    const heicBlob = new Blob([buffer], {
      type: file.type || "image/heic",
    });
    const converted = await heic2any({
      blob: heicBlob,
      toType: "image/jpeg",
      quality: 0.9,
    });

    const jpegBlob = Array.isArray(converted) ? converted[0] : converted;

    const safeName = file.name.replace(/\.heic$|\.heif$/i, ".jpg");
    sourceFile = new File([jpegBlob], safeName, { type: "image/jpeg" });
  }

  // ✅ EXIF 회전 반영
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

/* ---------------- PostImageUploader ---------------- */
export default function PostImageUploader() {
  const {
    control,
    setError,
    clearErrors,
    getValues,
    setValue,
    formState: { errors },
  } = useFormContext();

  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [previews, setPreviews] = useState<PreviewItem[]>([]);
  const [helperText, setHelperText] = useState<string | null>(null);

  const previewIds = useMemo(() => previews.map((p) => p.id), [previews]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 5 },
    }),
  );

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

  return (
    <Controller
      name="imageObjectKeys" // ✅ 기준 필드
      control={control}
      render={({ field }) => {
        const objectKeys = Array.isArray(field.value) ? field.value : [];

        return (
          <div>
            <input
              id={inputId}
              ref={inputRef}
              type="file"
              accept={ACCEPT}
              multiple
              hidden
              onChange={async (e) => {
                const files = Array.from(e.target.files ?? []);
                if (!files.length) return;
                setHelperText(null);

                const remain = MAX_FILES - previews.length;
                if (remain <= 0) {
                  setError("imageObjectKeys", {
                    type: "manual",
                    message: "최대 3장까지 업로드할 수 있습니다",
                  });
                  setHelperText("최대 3장까지 업로드할 수 있습니다");
                  return;
                }

                const selected = files.slice(0, remain);
                const hasOversize = selected.some(
                  (file) => file.size > MAX_FILE_SIZE,
                );
                const hasUnsupported = selected.some(
                  (file) => !isSupportedImageFile(file),
                );

                if (hasOversize || hasUnsupported) {
                  const message = hasOversize
                    ? "이미지 용량은 최대 30MB까지 가능합니다."
                    : "지원하지 않는 이미지 형식입니다.";
                  setError("imageObjectKeys", {
                    type: "manual",
                    message,
                  });
                  setHelperText(message);
                }

                const validSelected = selected.filter(
                  (file) =>
                    file.size <= MAX_FILE_SIZE && isSupportedImageFile(file),
                );
                if (validSelected.length === 0) {
                  e.target.value = "";
                  return;
                }

                /* ---------- optimistic preview ---------- */
                const tempItems: PreviewItem[] = validSelected.map((file) => {
                  const id = crypto.randomUUID();
                  return {
                    id,
                    url: URL.createObjectURL(file),
                    name: file.name,
                    objectKey: `pending:${id}`,
                  };
                });

                setPreviews((prev) => [...prev, ...tempItems]);

                // ✅ 수정: imageObjectKeys만 사용
                setValue(
                  "imageObjectKeys",
                  [...objectKeys, ...tempItems.map((i) => i.objectKey)],
                  { shouldDirty: true, shouldValidate: true },
                );

                try {
                  /* ---------- resize & upload ---------- */
                  const blobs = await Promise.all(
                    validSelected.map((f) => resizeAndCompress(f)),
                  );

                  const presigned = await requestUploadPresign(
                    "POST",
                    blobs.map(() => "webp"),
                  );

                  await Promise.all(
                    presigned.map((p, i) =>
                      uploadToPresignedUrl(p.uploadUrl, blobs[i], "image/webp"),
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
                      objectKey:
                        tempToReal.get(item.objectKey) ?? item.objectKey,
                    })),
                  );

                  const current =
                    (getValues("imageObjectKeys") as string[]) ?? [];

                  setValue(
                    "imageObjectKeys",
                    current.map((k) => tempToReal.get(k) ?? k),
                    { shouldDirty: true, shouldValidate: true },
                  );

                  clearErrors("imageObjectKeys");
                  setHelperText(null);
                } catch (err) {
                  tempItems.forEach((i) => URL.revokeObjectURL(i.url));
                  setPreviews((prev) =>
                    prev.filter((p) => !tempItems.some((t) => t.id === p.id)),
                  );

                  const current =
                    (getValues("imageObjectKeys") as string[]) ?? [];

                  setValue(
                    "imageObjectKeys",
                    current.filter(
                      (k) => !tempItems.some((t) => t.objectKey === k),
                    ),
                    { shouldDirty: true, shouldValidate: true },
                  );

                  setError("imageObjectKeys", {
                    type: "manual",
                    message:
                      err instanceof Error
                        ? err.message
                        : "이미지 업로드에 실패했습니다.",
                  });
                  if (err instanceof Error && /형식|type/i.test(err.message)) {
                    setHelperText("지원하지 않는 이미지 형식입니다.");
                  } else {
                    setHelperText(
                      err instanceof Error
                        ? err.message
                        : "이미지 업로드에 실패했습니다.",
                    );
                  }
                } finally {
                  e.target.value = "";
                }
              }}
            />

            {/* ---------- Preview ---------- */}
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={({ active, over }) => {
                if (!over || active.id === over.id) return;
                const oldIndex = previews.findIndex((p) => p.id === active.id);
                const newIndex = previews.findIndex((p) => p.id === over.id);

                setPreviews((p) => arrayMove(p, oldIndex, newIndex));
                field.onChange(arrayMove(objectKeys, oldIndex, newIndex));
              }}
            >
              <SortableContext
                items={previewIds}
                strategy={horizontalListSortingStrategy}
              >
                <div className="w-full overflow-x-auto overflow-y-hidden touch-pan-x">
                  <div className="flex gap-3 min-w-max">
                    {previews.map((p, i) => (
                      <SortablePreview
                        key={p.id}
                        item={p}
                        onRemove={() => {
                          URL.revokeObjectURL(p.url);
                          setPreviews((prev) =>
                            prev.filter((_, idx) => idx !== i),
                          );
                          field.onChange(
                            objectKeys.filter((_, idx) => idx !== i),
                          );
                        }}
                      />
                    ))}

                    {previews.length < MAX_FILES && (
                      <button
                        type="button"
                        onClick={() => inputRef.current?.click()}
                        className="h-[60vh] w-88.75 rounded-xl bg-gray-200 flex items-center justify-center"
                      >
                        <Image
                          src="/icons/upload.svg"
                          alt=""
                          width={24}
                          height={24}
                        />
                      </button>
                    )}
                  </div>
                </div>
              </SortableContext>
            </DndContext>

            {(helperText ||
              (typeof errors.imageObjectKeys?.message === "string" &&
                errors.imageObjectKeys?.message)) && (
              <p className="mt-2 text-[11px] text-red-500">
                {helperText ??
                  (errors.imageObjectKeys?.message as string | undefined)}
              </p>
            )}
          </div>
        );
      }}
    />
  );
}
