"use client";

import Image from "next/image";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Controller, useFormContext } from "react-hook-form";

type PreviewItem = {
  id: string;
  url: string;
  name: string;
};

const MAX_FILES = 3;
const ACCEPT = ".jpg,.jpeg,.png,.heic,image/jpeg,image/png,image/heic";

export default function PostImageUploader() {
  const { control, setError, clearErrors } = useFormContext();
  const [previews, setPreviews] = useState<PreviewItem[]>([]);
  const [overLimitMessage, setOverLimitMessage] = useState<string | null>(null);
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const canAddMore = previews.length < MAX_FILES;

  useEffect(() => {
    return () => {
      previews.forEach((item) => URL.revokeObjectURL(item.url));
    };
  }, [previews]);

  const removePreviewByIndex = useCallback((index: number) => {
    setPreviews((prev) => {
      const next = [...prev];
      const removed = next.splice(index, 1);
      removed.forEach((r) => URL.revokeObjectURL(r.url));
      return next;
    });
  }, []);

  return (
    <Controller
      name="images"
      control={control}
      render={({ field, fieldState }) => (
        <div>
          <input
            id={inputId}
            ref={fileInputRef}
            type="file"
            accept={ACCEPT}
            multiple
            className="hidden"
            onChange={(event) => {
              const files = event.target.files;
              if (!files || files.length === 0) return;

              const current = Array.isArray(field.value) ? field.value : [];
              const remainingSlots = MAX_FILES - current.length;

              if (remainingSlots <= 0) {
                setError("images", {
                  type: "manual",
                  message: "최대 3장까지 업로드할 수 있습니다",
                });
                setOverLimitMessage("최대 3장까지 업로드할 수 있습니다.");
                return;
              }

              const selected = Array.from(files);
              const nextBatch = selected.slice(0, remainingSlots);

              if (selected.length > remainingSlots) {
                setError("images", {
                  type: "manual",
                  message: "최대 3장까지 업로드할 수 있습니다",
                });
                setOverLimitMessage("최대 3장까지 업로드할 수 있습니다.");
              } else {
                clearErrors("images");
                setOverLimitMessage(null);
              }

              // 미리보기 생성
              const newPreviews: PreviewItem[] = nextBatch.map((file) => ({
                id: crypto.randomUUID(),
                url: URL.createObjectURL(file),
                name: file.name,
              }));

              setPreviews((prev) => [...prev, ...newPreviews]);
              field.onChange([...current, ...nextBatch]);
            }}
          />

          <div className="mt-[10px] overflow-x-auto">
            <div className="flex gap-3 snap-x snap-mandatory">
              {previews.map((item, index) => (
                <div
                  key={item.id}
                  className="relative h-[60vh] w-[355px] flex-shrink-0 snap-start rounded-xl bg-gray-200 overflow-hidden"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.url}
                    alt={item.name}
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    aria-label="사진 삭제"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      removePreviewByIndex(index);

                      const current = Array.isArray(field.value)
                        ? field.value
                        : [];
                      const nextFiles = [...current];
                      nextFiles.splice(index, 1);
                      field.onChange(nextFiles);
                    }}
                    className="absolute right-2 top-2 bg-white rounded-full p-1 hover:scale-110 transition-transform"
                  >
                    <Image
                      src="/icons/delete.svg"
                      alt=""
                      width={32}
                      height={32}
                    />
                  </button>
                  {/* <div className="absolute bottom-2 left-2 right-2 rounded bg-black/60 px-2 py-1 text-xs text-white line-clamp-1">
                    {item.name}
                  </div> */}
                </div>
              ))}

              {canAddMore && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="h-[60vh] w-[355px] flex-shrink-0 snap-start rounded-xl bg-gray-200 flex items-center justify-center cursor-pointer hover:bg-gray-300 transition-colors"
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
          </div>

          {fieldState.error && (
            <p className="text-red-500 text-[12px] mt-2">
              {fieldState.error.message}
            </p>
          )}

          {overLimitMessage && (
            <p className="text-red-500 text-[12px] mt-2">{overLimitMessage}</p>
          )}
        </div>
      )}
    />
  );
}
