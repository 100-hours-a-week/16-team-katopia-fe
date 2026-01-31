"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, type UseFormRegisterReturn } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import Header from "./Header";
import ProgressBar from "./ProgressBar";
import InfoText from "./InfoText";
import GenderSection from "./GenderSection";
import BodyInfoSection from "./BodyInfoSection";
import StyleSection from "./StyleSection";
import TermsSection from "./TermsSection";
import PolicyModal from "./PolicyModal";
import {
  PRIVACY_POLICY_TEXT,
  TERMS_OF_SERVICE_TEXT,
} from "../constants/policies";
import { API_BASE_URL } from "@/src/config/api";
import { authFetch, issueAccessToken } from "@/src/lib/auth";
import { useAuth } from "@/src/features/auth/providers/AuthProvider";
import { updateProfile } from "@/src/features/profile/api/updateProfile";
import {
  requestUploadPresign,
  uploadToPresignedUrl,
} from "@/src/features/upload/api/presignUpload";
import { getFileExtension } from "@/src/features/upload/utils/getFileExtension";

/* =========================
   Schema & Types
========================= */

const signupStep2Schema = z.object({
  gender: z.enum(["male", "female"]),
  height: z.string().optional(),
  weight: z.string().optional(),
});

type SignupStep2Values = z.infer<typeof signupStep2Schema>;
type GenderRegisterProps = UseFormRegisterReturn<"gender">;

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

const SIGNUP_PROFILE_IMAGE_DATA_KEY = "katopia.signupProfileImageData";

/* =========================
   Component
========================= */

export default function SignupStep2() {
  const router = useRouter();
  const { setAuthenticated } = useAuth();

  const [styles, setStyles] = useState<string[]>([]);
  const [styleError, setStyleError] = useState<string | null>(null);

  const [heightValue, setHeightValue] = useState("");
  const [weightValue, setWeightValue] = useState("");
  const [heightError, setHeightError] = useState<string | null>(null);
  const [weightError, setWeightError] = useState<string | null>(null);
  const weightInputRef = useRef<HTMLInputElement | null>(null);

  const styleErrorTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  const [privacyChecked, setPrivacyChecked] = useState(false);
  const [termsChecked, setTermsChecked] = useState(false);

  const [hasGender, setHasGender] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<SignupStep2Values>({
    resolver: zodResolver(signupStep2Schema),
    defaultValues: { gender: undefined, height: "", weight: "" },
  });

  /* -------------------------
     Gender Register
  ------------------------- */
  const genderRegister = useMemo<GenderRegisterProps>(() => {
    const base = register("gender");

    return {
      ...base,
      onChange: ((e) => {
        const value = (e.target as HTMLInputElement | undefined)?.value;
        setHasGender(!!value);
        return base.onChange(e);
      }) as typeof base.onChange,
    };
  }, [register]);

  /* -------------------------
     Height / Weight
  ------------------------- */
  const handleNumericChange = useCallback(
    (field: "height" | "weight", raw: string, focusNext?: () => void) => {
      const digits = raw.replace(/\D/g, "").slice(0, 3);

      if (!digits) {
        setValue(field, "");
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        field === "height" ? setHeightValue("") : setWeightValue("");
        if (field === "height") {
          setHeightError(null);
        } else {
          setWeightError(null);
        }
        return;
      }

      const parsed = parseInt(digits, 10);
      if (!parsed || parsed < 1) return;

      if (field === "height") {
        if (parsed < 100 || parsed > 300) {
          setHeightError("키는 100~300 사이로 입력해주세요.");
        } else {
          setHeightError(null);
        }
      } else {
        if (parsed < 20 || parsed > 300) {
          setWeightError("몸무게는 20~300 사이로 입력해주세요.");
        } else {
          setWeightError(null);
        }
      }

      const normalized = String(parsed);
      setValue(field, normalized, { shouldDirty: true, shouldValidate: true });

      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      field === "height"
        ? setHeightValue(normalized)
        : setWeightValue(normalized);

      if (normalized.length === 3 && focusNext) focusNext();
    },
    [setValue],
  );

  const handleHeightChange = useCallback(
    (value: string) =>
      handleNumericChange("height", value, () =>
        weightInputRef.current?.focus(),
      ),
    [handleNumericChange],
  );

  const handleWeightChange = useCallback(
    (value: string) => handleNumericChange("weight", value),
    [handleNumericChange],
  );

  /* -------------------------
     Style
  ------------------------- */
  const toggleStyle = useCallback((style: string) => {
    setStyles((prev) => {
      if (prev.includes(style)) return prev.filter((s) => s !== style);

      if (prev.length >= 2) {
        setStyleError("스타일은 최대 2개까지 선택 가능합니다.");
        styleErrorTimeoutRef.current = setTimeout(
          () => setStyleError(null),
          2000,
        );
        return prev;
      }

      return [...prev, style];
    });
  }, []);

  /* -------------------------
     Submit (중요!)
  ------------------------- */
  const isHeightValid = useMemo(() => {
    if (!heightValue) return true;
    const parsed = parseInt(heightValue, 10);
    return parsed >= 100 && parsed <= 300;
  }, [heightValue]);

  const isWeightValid = useMemo(() => {
    if (!weightValue) return true;
    const parsed = parseInt(weightValue, 10);
    return parsed >= 20 && parsed <= 300;
  }, [weightValue]);

  const onSubmit = useCallback(
    async (data: SignupStep2Values) => {
      try {
        if (!isHeightValid) {
          setHeightError("키는 100~300 사이로 입력해주세요.");
          return;
        }
        if (!isWeightValid) {
          setWeightError("몸무게는 20~300 사이로 입력해주세요.");
          return;
        }
        if (styles.length > 2) {
          setStyleError("스타일은 최대 2개까지 선택 가능합니다.");
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

        const res = await fetch(`${API_BASE_URL}/api/members`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            nickname,
            gender,
          }),
        });

        if (!res.ok) {
          const error = await res.json().catch(() => null);
          console.error(error?.code ?? res.status);
          throw new Error(`회원가입 실패 (${res.status})`);
        }

        await issueAccessToken();
        setAuthenticated(true);

        try {
          window.localStorage.setItem(
            "katopia.signupWelcome",
            `환영합니다. ${nickname} 님!`,
          );
        } catch {
          // ignore storage errors
        }

        let signupProfileImageUrl: string | null = null;
        let signupProfileImageData: string | null = null;
        try {
          signupProfileImageData = window.localStorage.getItem(
            SIGNUP_PROFILE_IMAGE_DATA_KEY,
          );
        } catch {
          signupProfileImageData = null;
        }

        const hasOptionalInputs =
          Boolean(data.height) ||
          Boolean(data.weight) ||
          styles.length > 0 ||
          Boolean(signupProfileImageData);

        if (signupProfileImageData) {
          try {
            const res = await fetch(signupProfileImageData);
            const blob = await res.blob();
            const tempFile = new File([blob], "profile", { type: blob.type });
            const extension = getFileExtension(tempFile);
            if (!extension) {
              throw new Error("지원하지 않는 이미지 확장자입니다.");
            }
            const file = new File([blob], `profile.${extension}`, {
              type: blob.type,
            });
            const [presigned] = await requestUploadPresign("PROFILE", [
              extension,
            ]);
            await uploadToPresignedUrl(presigned.uploadUrl, file, file.type);
            signupProfileImageUrl = presigned.accessUrl;
          } catch (err) {
            alert(
              err instanceof Error
                ? err.message
                : "프로필 이미지 업로드에 실패했습니다.",
            );
            return;
          }
        }

        if (hasOptionalInputs) {
          const payload = {
            nickname,
            gender,
            profileImageUrl: signupProfileImageUrl || undefined,
            height: data.height ? Number(data.height) : null,
            weight: data.weight ? Number(data.weight) : null,
            enableRealtimeNotification: true,
            style: styles.map((style) => STYLE_TO_ENUM[style] ?? style),
          };
          console.log("[signup] PATCH /api/members request", payload);
          try {
            await updateProfile({ ...payload });
          } catch (err) {
            const message =
              err instanceof Error ? err.message : "프로필 업데이트 실패";
            console.error("[signup] PATCH /api/members failed", err);
            alert(message);
            return;
          }
        }

        try {
          window.localStorage.removeItem("signup-nickname");
          window.localStorage.removeItem(SIGNUP_PROFILE_IMAGE_DATA_KEY);
        } catch {
          // ignore storage errors
        }

        try {
          const meRes = await authFetch(`${API_BASE_URL}/api/members/me`, {
            method: "GET",
            cache: "no-store",
          });
          const meBody = await meRes
            .clone()
            .json()
            .catch(() => null);
          console.log("[signup] GET /api/members/me response", meBody);
        } catch (err) {
          console.log("[signup] GET /api/members/me failed", err);
        }

        router.replace("/home");
        return;
      } catch (err) {
        console.error(err);
        alert("회원가입 중 오류가 발생했습니다.");
      }
    },
    [router, setAuthenticated, styles, isHeightValid, isWeightValid],
  );

  const isSubmitDisabled = useMemo(
    () =>
      !hasGender ||
      !privacyChecked ||
      !termsChecked ||
      !isHeightValid ||
      !isWeightValid,
    [hasGender, privacyChecked, termsChecked, isHeightValid, isWeightValid],
  );

  useEffect(() => {
    return () => {
      if (styleErrorTimeoutRef.current) {
        clearTimeout(styleErrorTimeoutRef.current);
      }
    };
  }, []);

  /* -------------------------
     Render
  ------------------------- */
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="min-h-screen px-6 py-8">
      <Header onBack={() => router.back()} />
      <ProgressBar />
      <InfoText />

      <GenderSection register={genderRegister} error={errors.gender?.message} />

      <BodyInfoSection
        heightValue={heightValue}
        weightValue={weightValue}
        onHeightChange={handleHeightChange}
        onWeightChange={handleWeightChange}
        weightInputRef={weightInputRef}
        heightError={heightError}
        weightError={weightError}
      />

      <StyleSection styles={styles} onToggle={toggleStyle} error={styleError} />

      <TermsSection
        privacyChecked={privacyChecked}
        termsChecked={termsChecked}
        onPrivacyChange={setPrivacyChecked}
        onTermsChange={setTermsChecked}
        onShowPrivacy={() => setShowPrivacyModal(true)}
        onShowTerms={() => setShowTermsModal(true)}
      />

      {showPrivacyModal && (
        <PolicyModal
          title="개인정보 처리방침"
          content={PRIVACY_POLICY_TEXT}
          onClose={() => setShowPrivacyModal(false)}
        />
      )}

      {showTermsModal && (
        <PolicyModal
          title="서비스 이용 약관"
          content={TERMS_OF_SERVICE_TEXT}
          onClose={() => setShowTermsModal(false)}
        />
      )}

      <Button
        type="submit"
        disabled={isSubmitDisabled}
        className={`mt-12 h-14 w-full text-base font-semibold ${
          isSubmitDisabled ? "bg-gray-200 text-gray-500" : "bg-black text-white"
        }`}
      >
        완료
      </Button>
    </form>
  );
}
