import { z } from "zod";

const fileSchema =
  typeof File !== "undefined" ? z.instanceof(File) : z.any();

export const postCreateSchema = z.object({
  images: z
    .array(fileSchema)
    .min(1, "이미지는 최소 1장 이상 업로드해야 합니다.")
    .max(3, "최대 3장까지 업로드할 수 있습니다"),
  content: z
    .string()
    .min(1, "내용을 입력해주세요.")
    .max(500, "최대 500자까지 입력할 수 있습니다."),
});

export type PostCreateValues = z.infer<typeof postCreateSchema>;
