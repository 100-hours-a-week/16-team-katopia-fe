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
import { issueAccessToken } from "@/src/lib/auth";
import { useAuth } from "@/src/features/auth/providers/AuthProvider";

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
        return;
      }

      const parsed = parseInt(digits, 10);
      if (!parsed || parsed < 1) return;

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
  const onSubmit = useCallback(
    async (data: SignupStep2Values) => {
      try {
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

        const gender = data.gender === "male" ? "M" : "F";

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
          window.localStorage.removeItem("signup-nickname");
        } catch {
          // ignore storage errors
        }

        router.replace("/home");
      } catch (err) {
        console.error(err);
        alert("회원가입 중 오류가 발생했습니다.");
      }
    },
    [router, setAuthenticated],
  );

  const isSubmitDisabled = useMemo(
    () => !hasGender || !privacyChecked || !termsChecked,
    [hasGender, privacyChecked, termsChecked],
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
