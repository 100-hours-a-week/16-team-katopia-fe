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

  // ✅ HEIC → JPEG 변환
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
  const { control, setError, clearErrors, getValues, setValue } =
    useFormContext();

  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [previews, setPreviews] = useState<PreviewItem[]>([]);

  const previewIds = useMemo(() => previews.map((p) => p.id), [previews]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 5 },
    }),
  );

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

                const remain = MAX_FILES - previews.length;
                if (remain <= 0) {
                  setError("imageObjectKeys", {
                    type: "manual",
                    message: "최대 3장까지 업로드할 수 있습니다",
                  });
                  return;
                }

                const selected = files.slice(0, remain);

                /* ---------- optimistic preview ---------- */
                const tempItems: PreviewItem[] = selected.map((file) => {
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
                    selected.map((f) => resizeAndCompress(f)),
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
          </div>
        );
      }}
    />
  );
}
