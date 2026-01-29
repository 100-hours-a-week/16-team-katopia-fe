import { useFormContext } from "react-hook-form";

export default function PostContentInput() {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  return (
    <div className="mt-4">
      <textarea
        {...register("content")}
        placeholder="내용을 입력해주세요."
        className="w-full border p-3 text-[13px] rounded-[5px] focus:outline-none focus:border-black focus:border resize-none"
        rows={5}
      />

      {typeof errors.content?.message === "string" && (
        <p className="text-red-500 text-[12px]">{errors.content.message}</p>
      )}
    </div>
  );
}
