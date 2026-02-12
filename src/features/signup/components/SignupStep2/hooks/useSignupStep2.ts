"use client";

import { useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { API_BASE_URL } from "@/src/config/api";
import { issueAccessToken } from "@/src/lib/auth";
import { useAuth } from "@/src/features/auth/providers/AuthProvider";
import {
  requestUploadPresign,
  uploadToPresignedUrl,
} from "@/src/features/upload/api/presignUpload";
import {
  clearSignupProfileImageBlob,
  getSignupProfileImageBlob,
} from "../../SignupStep1/hooks/useProfileImage";

const signupStep2Schema = z.object({
  gender: z.enum(["male", "female"]),
  height: z
    .string()
    .optional()
    .refine(
      (value) => {
        if (!value) return true;
        const parsed = parseInt(value, 10);
        return parsed >= 100 && parsed <= 300;
      },
      { message: "키는 100~300 사이로 입력해주세요." },
    ),
  weight: z
    .string()
    .optional()
    .refine(
      (value) => {
        if (!value) return true;
        const parsed = parseInt(value, 10);
        return parsed >= 20 && parsed <= 300;
      },
      { message: "몸무게는 20~300 사이로 입력해주세요." },
    ),
});

export type SignupStep2Values = z.infer<typeof signupStep2Schema>;

const STYLE_TO_ENUM: Record<string, string> = {
  미니멀: "MINIMAL",
  페미닌: "FEMININE",
  시크모던: "CHIC_MODERN",
  러블리: "LOVELY",
  빈티지: "VINTAGE",
  캐주얼: "CASUAL",
  스트릿: "STREET",
  클래식: "CLASSIC",
  스포티: "SPORTY",
  Y2K: "Y2K",
};

export function useSignupStep2() {
  const router = useRouter();
  const { setAuthenticated } = useAuth();

  const stylesRef = useRef<string[]>([]);
  const styleErrorTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const form = useForm<SignupStep2Values>({
    resolver: zodResolver(signupStep2Schema),
    mode: "onChange",
    defaultValues: { gender: undefined, height: "", weight: "" },
  });

  const setStylesRef = useCallback((next: string[]) => {
    stylesRef.current = next;
  }, []);

  const onSubmit = useCallback(
    async (data: SignupStep2Values) => {
      try {
        const styles = stylesRef.current;
        if (styles.length > 2) {
          return;
        }

        let nickname = "";
        try {
          nickname = window.localStorage.getItem("signup-nickname") ?? "";
        } catch {
          nickname = "";
        }

        if (!nickname) {
          alert("닉네임 정보가 없습니다. 다시 시도해주세요.");
          router.replace("/signup/step1");
          return;
        }

        const gender: "M" | "F" = data.gender === "male" ? "M" : "F";

        const signupProfileImageBlob = getSignupProfileImageBlob();

        const payload: {
          nickname: string;
          gender: "M" | "F";
          profileImageObjectKey: string | null;
          height: number | null;
          weight: number | null;
          enableRealtimeNotification: boolean;
          style: string[] | null;
        } = {
          nickname,
          gender,
          profileImageObjectKey: null,
          height: data.height ? Number(data.height) : null,
          weight: data.weight ? Number(data.weight) : null,
          enableRealtimeNotification: true,
          style:
            styles.length > 0
              ? styles.map((style) => STYLE_TO_ENUM[style] ?? style)
              : null,
        };

        const res = await fetch(`${API_BASE_URL}/api/members`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const error = await res.json().catch(() => null);
          console.error(error?.code ?? res.status);
          throw new Error(`회원가입 실패 (${res.status})`);
        }

        const accessToken = await issueAccessToken();
        setAuthenticated(true);

        try {
          window.localStorage.setItem(
            "katopia.signupWelcome",
            `환영합니다. ${nickname} 님!`,
          );
        } catch {
          // ignore storage errors
        }

        if (signupProfileImageBlob) {
          let signupProfileImageObjectKey: string | null = null;
          try {
            const [presigned] = await requestUploadPresign("PROFILE", ["webp"]);
            await uploadToPresignedUrl(
              presigned.uploadUrl,
              signupProfileImageBlob,
              "image/webp",
            );
            signupProfileImageObjectKey = presigned.imageObjectKey.replace(
              /^\/+/,
              "",
            );
          } catch (err) {
            const message =
              err instanceof Error
                ? err.message
                : "프로필 이미지 업로드에 실패했습니다.";
            alert(message);
            return;
          }

          try {
            await fetch(`${API_BASE_URL}/api/members`, {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
              },
              credentials: "include",
              body: JSON.stringify({
                profileImageObjectKey: signupProfileImageObjectKey,
              }),
            });
          } catch (err) {
            console.error("[signup] PATCH /api/members failed", err);
          }
        }

        try {
          window.localStorage.removeItem("signup-nickname");
        } catch {
          // ignore storage errors
        }
        clearSignupProfileImageBlob();

        router.replace("/home");
      } catch (err) {
        console.error("[signup] submit failed", err);
        alert("회원가입 중 오류가 발생했습니다.");
      }
    },
    [router, setAuthenticated],
  );

  useEffect(() => {
    const timeout = styleErrorTimeoutRef.current;
    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, []);

  return {
    form,
    onSubmit,
    stylesRef,
    setStylesRef,
    styleErrorTimeoutRef,
  };
}
