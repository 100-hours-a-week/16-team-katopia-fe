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

async function resizeAndCompress(
  file: File,
  maxWidth = 1080,
  quality = 0.8,
): Promise<Blob> {
  let sourceFile = file;

  // 1️⃣ HEIC → JPEG 변환 (브라우저 호환)
  if (file.type === "image/heic" || file.name.toLowerCase().endsWith(".heic")) {
    const converted = await heic2any({
      blob: file,
      toType: "image/jpeg",
      quality: 0.9,
    });

    // heic2any는 Blob | Blob[] 반환 가능
    const jpegBlob = Array.isArray(converted) ? converted[0] : converted;

    sourceFile = new File([jpegBlob], file.name.replace(/\.heic$/i, ".jpg"), {
      type: "image/jpeg",
    });
  }

  // 2️⃣ EXIF 회전 포함 디코딩
  const bitmap = await createImageBitmap(sourceFile, {
    imageOrientation: "from-image",
  });

  // 3️⃣ 리사이징
  const scale = Math.min(1, maxWidth / bitmap.width);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width * scale;
  canvas.height = bitmap.height * scale;

  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

  // 4️⃣ WebP로 최종 압축
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

export default function PostImageUploader() {
  const { control, setError, clearErrors } = useFormContext();
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
      name="images" // ⭐ string[] (objectKey)
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
                  setError("images", {
                    type: "manual",
                    message: "최대 3장까지 업로드할 수 있습니다",
                  });
                  return;
                }

                const selected = files.slice(0, remain);

                try {
                  // 1️⃣ 리사이징 / 압축
                  const blobs = await Promise.all(
                    selected.map((f) => resizeAndCompress(f)),
                  );

                  // 2️⃣ presign 요청 (POST 카테고리)
                  const presigned = await requestUploadPresign(
                    "POST",
                    blobs.map(() => "webp"),
                  );

                  // 3️⃣ PUT 업로드
                  await Promise.all(
                    presigned.map((p, i) =>
                      uploadToPresignedUrl(p.uploadUrl, blobs[i], "image/webp"),
                    ),
                  );

                  // 4️⃣ preview + objectKey 저장
                  const newItems: PreviewItem[] = presigned.map((p, i) => ({
                    id: crypto.randomUUID(),
                    url: URL.createObjectURL(blobs[i]),
                    name: selected[i].name,
                    objectKey: p.imageObjectKey,
                  }));

                  setPreviews((prev) => [...prev, ...newItems]);
                  field.onChange([
                    ...objectKeys,
                    ...presigned.map((p) => p.imageObjectKey),
                  ]);

                  clearErrors("images");
                } catch (err) {
                  setError("images", {
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

            {/* Preview */}
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
                <div className="flex gap-3">
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
              </SortableContext>
            </DndContext>
          </div>
        );
      }}
    />
  );
}
