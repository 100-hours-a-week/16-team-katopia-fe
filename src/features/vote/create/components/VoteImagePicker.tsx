"use client";

import Image from "next/image";
import { memo, useEffect, useId, useRef, useCallback } from "react";
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
  useVoteImageUploader,
} from "../hooks/useVoteImageUploader";

const SortablePreview = memo(function SortablePreview({
  item,
  index,
  onRemoveAt,
}: {
  item: PreviewItem;
  index: number;
  onRemoveAt: (index: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: item.id });

  const handleRemove = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();
      onRemoveAt(index);
    },
    [index, onRemoveAt],
  );

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      {...attributes}
      {...listeners}
      className="relative h-100 w-[78vw] max-w-[320px] shrink-0 overflow-hidden rounded-[14px] bg-gray-100"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={item.url} alt="" className="h-full w-full object-cover" />

      <button
        type="button"
        onClick={handleRemove}
        className="absolute right-2 top-2 rounded-full bg-white p-1"
      >
        <Image src="/icons/delete.svg" alt="삭제" width={24} height={24} />
      </button>
    </div>
  );
});

const VoteImagePreviewList = memo(function VoteImagePreviewList({
  previews,
  previewIds,
  sensors,
  onDragEnd,
  onRemoveAt,
  onAddClick,
  canAdd,
  scrollRef,
  isEmpty,
}: {
  previews: PreviewItem[];
  previewIds: string[];
  sensors: ReturnType<typeof useSensors>;
  onDragEnd: (event: DragEndEvent) => void;
  onRemoveAt: (index: number) => void;
  onAddClick: () => void;
  canAdd: boolean;
  scrollRef: React.RefObject<HTMLDivElement | null>;
  isEmpty: boolean;
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
          className="mt-10 w-full overflow-x-scroll overflow-y-hidden touch-pan-x image-preview-scroll"
        >
          <div
            className={
              isEmpty ? "flex w-full justify-center" : "flex min-w-max gap-4"
            }
          >
            {previews.map((p, i) => (
              <SortablePreview
                key={p.id}
                item={p}
                index={i}
                onRemoveAt={onRemoveAt}
              />
            ))}

            {canAdd && (
              <button
                type="button"
                onClick={onAddClick}
                className="flex h-95 w-[78vw] max-w-[320px] flex-col items-center justify-center rounded-[14px] bg-gray-100 text-gray-400"
              >
                <span className="text-[30px] leading-none">+</span>
                <span className="mt-2 text-[12px]">투표 사진 올리기</span>
              </button>
            )}
          </div>
        </div>
      </SortableContext>
    </DndContext>
  );
});

export default function VoteImagePicker({
  onCountChange,
  onPreviewsChange,
}: {
  onCountChange?: (count: number) => void;
  onPreviewsChange?: (items: PreviewItem[]) => void;
}) {
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
    canAdd,
    handleAddClick,
    handleRemoveAt,
    handleDragEnd,
    handleFileChange,
  } = useVoteImageUploader();

  useEffect(() => {
    onCountChange?.(previews.length);
    onPreviewsChange?.(previews);
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
  }, [onCountChange, onPreviewsChange, previews]);

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

      <VoteImagePreviewList
        previews={previews}
        previewIds={previewIds}
        sensors={sensors}
        onDragEnd={handleDragEnd}
        onRemoveAt={handleRemoveAt}
        onAddClick={handleAddClick}
        canAdd={canAdd}
        scrollRef={scrollRef}
        isEmpty={previews.length === 0}
      />

      {helperText && (
        <p className="mt-4 text-[11px] text-[#ff5a5a]">{helperText}</p>
      )}
    </div>
  );
}
