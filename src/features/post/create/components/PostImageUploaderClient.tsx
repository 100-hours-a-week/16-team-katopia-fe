"use client";

import Image from "next/image";
import { memo, useEffect, useId, useRef } from "react";
import {
  DndContext,
  type DragEndEvent,
  closestCenter,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import {
  ACCEPT,
  type PreviewItem,
  usePostImageUploader,
} from "../hooks/usePostImageUploader";

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
      className="relative h-[60vh] w-88.75 shrink-0 overflow-hidden rounded-[5px] bg-gray-200"
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
        className="absolute right-2 top-2 rounded-full bg-white p-1"
      >
        <Image src="/icons/delete.svg" alt="삭제" width={24} height={24} />
      </button>
    </div>
  );
}

const PostImagePreviewList = memo(function PostImagePreviewList({
  previews,
  previewIds,
  sensors,
  onDragEnd,
  onRemoveAt,
  onAddClick,
  canAdd,
  scrollRef,
}: {
  previews: PreviewItem[];
  previewIds: string[];
  sensors: ReturnType<typeof useSensors>;
  onDragEnd: (event: DragEndEvent) => void;
  onRemoveAt: (index: number) => void;
  onAddClick: () => void;
  canAdd: boolean;
  scrollRef: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
    >
      <SortableContext
        items={previewIds}
        strategy={horizontalListSortingStrategy}
      >
        <div
          ref={scrollRef}
          className="mt-4 w-full overflow-x-scroll overflow-y-hidden touch-pan-x image-preview-scroll"
        >
          <div
            className={
              previews.length === 0
                ? "flex w-full justify-center"
                : "flex min-w-max gap-3"
            }
          >
            {previews.map((p, i) => (
              <SortablePreview
                key={p.id}
                item={p}
                onRemove={() => onRemoveAt(i)}
              />
            ))}

            {canAdd && (
              <button
                type="button"
                onClick={onAddClick}
                className="flex h-[60vh] w-88.75 flex-col items-center justify-center rounded-xl bg-gray-200 text-gray-400"
              >
                <span className="text-[30px] leading-none">+</span>
                <span className="mt-2 text-[12px]">게시글 사진 올리기</span>
                <span className="mt-3 text-[10px] text-gray-400">
                  JPG, JPEG, PNG, WEBP
                </span>
                <span className="text-[10px] text-gray-400">
                  최대 3장 업로드 가능
                </span>
              </button>
            )}
          </div>
        </div>
      </SortableContext>
    </DndContext>
  );
});

/* ---------------- PostImageUploader ---------------- */
export default function PostImageUploaderClient() {
  const inputId = useId();
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef(0);
  const {
    inputRef,
    inputKey,
    previews,
    previewIds,
    sensors,
    helperText,
    errors,
    canAdd,
    handleAddClick,
    handleRemoveAt,
    handleDragEnd,
    handleFileChange,
  } = usePostImageUploader();

  useEffect(() => {
    const currentCount = previews.length;
    if (currentCount <= prevCountRef.current) {
      prevCountRef.current = currentCount;
      return;
    }

    const container = scrollRef.current;
    if (!container) {
      prevCountRef.current = currentCount;
      return;
    }

    requestAnimationFrame(() => {
      container.scrollBy({ left: 80, behavior: "smooth" });
    });

    prevCountRef.current = currentCount;
  }, [previews.length]);

  return (
    <div>
      <input
        id={inputId}
        key={inputKey}
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        multiple
        hidden
        onChange={handleFileChange}
      />

      {/* ---------- Preview ---------- */}
      <PostImagePreviewList
        previews={previews}
        previewIds={previewIds}
        sensors={sensors}
        onDragEnd={handleDragEnd}
        onRemoveAt={handleRemoveAt}
        onAddClick={handleAddClick}
        canAdd={canAdd}
        scrollRef={scrollRef}
      />

      {(helperText ||
        (typeof errors.imageObjectKeys?.message === "string" &&
          errors.imageObjectKeys?.message)) && (
        <p className="mt-4 text-[11px] text-[#ff5a5a]">
          {helperText ??
            (errors.imageObjectKeys?.message as string | undefined)}
        </p>
      )}
    </div>
  );
}
