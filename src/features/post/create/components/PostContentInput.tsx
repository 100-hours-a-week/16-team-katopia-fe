import { useFormContext, useWatch } from "react-hook-form";

export default function PostContentInput() {
  const {
    register,
    formState: { errors },
  } = useFormContext();
  const content = useWatch({ name: "content" }) as string | undefined;
  const count = (content ?? "").length;

  return (
    <div className="mt-4">
      <textarea
        {...register("content")}
        placeholder="내용을 입력해주세요."
        className="w-full border p-3 text-[13px] rounded-[5px] focus:outline-none focus:border-black focus:border resize-none"
        rows={5}
        maxLength={200}
      />

      <div className="mt-1 text-right text-[11px] text-muted-foreground">
        {count}/200
      </div>

      {typeof errors.content?.message === "string" && (
        <p className="text-red-500 text-[12px]">{errors.content.message}</p>
      )}
    </div>
  );
}
