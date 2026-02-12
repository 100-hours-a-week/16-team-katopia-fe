import { useCallback, useRef } from "react";
import { useFormContext } from "react-hook-form";

export default function PostContentInput() {
  const {
    register,
    formState: { errors },
  } = useFormContext();
  const countRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const { ref: registerRef, ...registered } = register("content");

  const setRefs = useCallback(
    (el: HTMLTextAreaElement | null) => {
      textareaRef.current = el;
      registerRef(el);
      if (el && countRef.current) {
        countRef.current.textContent = `${el.value.length}/200`;
      }
    },
    [registerRef],
  );

  const handleInput = useCallback(
    (event: React.FormEvent<HTMLTextAreaElement>) => {
      if (!countRef.current) return;
      countRef.current.textContent = `${event.currentTarget.value.length}/200`;
    },
    [],
  );

  return (
    <div className="mt-4">
      <textarea
        {...registered}
        ref={setRefs}
        onInput={handleInput}
        placeholder="내용을 입력해주세요."
        className="w-full border p-3 text-[13px] rounded-[5px] focus:outline-none focus:border-black focus:border resize-none"
        rows={5}
        maxLength={200}
      />

      <div
        ref={countRef}
        className="mt-1 text-right text-[11px] text-muted-foreground"
      >
        0/200
      </div>

      {typeof errors.content?.message === "string" && (
        <p className="text-red-500 text-[12px]">{errors.content.message}</p>
      )}
    </div>
  );
}
