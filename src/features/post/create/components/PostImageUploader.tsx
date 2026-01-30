"use client";

import Image from "next/image";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import {
  DndContext,
  PointerSensor,
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
import { Controller, useFormContext, useWatch } from "react-hook-form";

type PreviewItem = {
  id: string;
  url: string; // local preview url
  name: string;
};

const MAX_FILES = 3;
const ACCEPT =
  ".jpg,.jpeg,.png,.webp,.heic,image/jpeg,image/png,image/webp,image/heic";

const toBlobUrl = (file: File) => URL.createObjectURL(file);

function SortablePreview({
  item,
  onRemove,
}: {
  item: PreviewItem;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="relative h-[60vh] w-88.75 shrink-0 snap-start rounded-xl bg-gray-200 overflow-hidden touch-none"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={item.url} alt={item.name} className="h-full w-full object-cover" />

      <button
        type="button"
        aria-label="사진 삭제"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onRemove();
        }}
        onPointerDown={(e) => {
          e.stopPropagation();
        }}
        className="absolute right-2 top-2 bg-white rounded-full p-1 hover:scale-110 transition-transform"
      >
        <Image src="/icons/delete.svg" alt="" width={32} height={32} />
      </button>
    </div>
  );
}

export default function PostImageUploader() {
  const { control, setError, clearErrors } = useFormContext();
  const content = useWatch({ name: "content" }) as string | undefined;
  const watchedImages = useWatch({ name: "images" }) as File[] | undefined;
  const [previews, setPreviews] = useState<PreviewItem[]>([]);
  const [overLimitMessage, setOverLimitMessage] = useState<string | null>(null);

  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const canAddMore = previews.length < MAX_FILES;
  const shouldShowImageHelper =
    (content?.trim()?.length ?? 0) > 0 && (watchedImages?.length ?? 0) === 0;
  const previewIds = useMemo(() => previews.map((preview) => preview.id), [previews]);
  const sensors = useSensors(useSensor(PointerSensor));

  useEffect(() => {
    return () => {
      previews.forEach((item) => URL.revokeObjectURL(item.url));
    };
  }, [previews]);

  const removePreviewByIndex = useCallback(
    (index: number, onChange: (v: File[]) => void, currentFiles: File[]) => {
      setPreviews((prev) => {
        const next = [...prev];
        const removed = next.splice(index, 1);
        removed.forEach((r) => URL.revokeObjectURL(r.url));
        return next;
      });

      const nextFiles = [...currentFiles];
      nextFiles.splice(index, 1);
      onChange(nextFiles);
    },
    [],
  );

  return (
    <Controller
      name="images"
      control={control}
      render={({ field, fieldState }) => {
        const currentFiles = Array.isArray(field.value) ? field.value : [];

        return (
          <div>
            <input
              id={inputId}
              ref={fileInputRef}
              type="file"
              accept={ACCEPT}
              multiple
              className="hidden"
              onChange={async (event) => {
                const files = event.target.files;
                if (!files || files.length === 0) return;

                const remainingSlots = MAX_FILES - currentFiles.length;

                if (remainingSlots <= 0) {
                  setError("images", {
                    type: "manual",
                    message: "최대 3장까지 업로드할 수 있습니다",
                  });
                  setOverLimitMessage("최대 3장까지 업로드할 수 있습니다.");
                  event.target.value = "";
                  return;
                }

                const selectedFiles = Array.from(files).slice(
                  0,
                  remainingSlots,
                );

                if (files.length > remainingSlots) {
                  setError("images", {
                    type: "manual",
                    message: "최대 3장까지 업로드할 수 있습니다",
                  });
                  setOverLimitMessage("최대 3장까지 업로드할 수 있습니다.");
                } else {
                  clearErrors("images");
                  setOverLimitMessage(null);
                }

                const blobUrls = selectedFiles.map(toBlobUrl);

                const newPreviews: PreviewItem[] = blobUrls.map(
                  (url, index) => ({
                    id: crypto.randomUUID(),
                    url,
                    name: selectedFiles[index].name,
                  }),
                );

                setPreviews((prev) => [...prev, ...newPreviews]);

                // ✅ RHF에는 File[] 저장
                field.onChange([...currentFiles, ...selectedFiles]);
                event.target.value = "";
              }}
            />

            {/* Preview 영역 */}
            <div className="mt-2.5 overflow-x-auto">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={(event) => {
                  const { active, over } = event;
                  if (!over || active.id === over.id) return;
                  const oldIndex = previews.findIndex(
                    (item) => item.id === active.id,
                  );
                  const newIndex = previews.findIndex(
                    (item) => item.id === over.id,
                  );
                  if (oldIndex < 0 || newIndex < 0) return;
                  setPreviews((prev) => arrayMove(prev, oldIndex, newIndex));
                  const nextFiles = arrayMove(currentFiles, oldIndex, newIndex);
                  field.onChange(nextFiles);
                }}
              >
                <SortableContext
                  items={previewIds}
                  strategy={horizontalListSortingStrategy}
                >
                  <div className="flex gap-3 snap-x snap-mandatory">
                    {previews.map((item, index) => (
                      <SortablePreview
                        key={item.id}
                        item={item}
                        onRemove={() =>
                          removePreviewByIndex(
                            index,
                            field.onChange,
                            currentFiles,
                          )
                        }
                      />
                    ))}

                    {canAddMore && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          fileInputRef.current?.click();
                        }}
                        className="h-[60vh] w-88.75 shrink-0 snap-start rounded-xl bg-gray-200 flex items-center justify-center cursor-pointer hover:bg-gray-300 transition-colors"
                        aria-label="사진 추가"
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

            {/* Error UI */}
            {fieldState.error && (
              <p className="text-red-500 text-[12px] mt-2">
                {fieldState.error.message}
              </p>
            )}

            {overLimitMessage && (
              <p className="text-red-500 text-[12px] mt-2">
                {overLimitMessage}
              </p>
            )}

            {shouldShowImageHelper &&
              !fieldState.error &&
              !overLimitMessage && (
                <p className="text-red-500 text-[12px] mt-2">
                  이미지는 최소 1장 이상 업로드해야 합니다.
                </p>
              )}
          </div>
        );
      }}
    />
  );
}
