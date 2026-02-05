import { z } from "zod";

export const signupStep1Schema = z.object({
  nickname: z
    .string()
    .min(2, "닉네임은 최소 2자 이상, 최대 20자 이하만 가능합니다.")
    .max(20, "닉네임은 최소 2자 이상, 최대 20자 이하만 가능합니다.")
    .regex(/^\S+$/, "공백은 입력할 수 없습니다")
    .regex(
      /^[a-zA-Z0-9._\p{Script=Hangul}]+$/u,
      "특수문자는 '_' 또는 '.'만 허용됩니다.",
    ),
});

export type SignupStep1Values = z.infer<typeof signupStep1Schema>;
