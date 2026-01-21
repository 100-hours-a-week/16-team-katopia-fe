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

const signupStep2Schema = z.object({
  gender: z.enum(["male", "female"]),
  height: z.string().optional(),
  weight: z.string().optional(),
});

type SignupStep2Values = z.infer<typeof signupStep2Schema>;

// ✅ "gender" 전용 register return 타입으로 고정(선택)
type GenderRegisterProps = UseFormRegisterReturn<"gender">;

export default function SignupStep2() {
  const router = useRouter();

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

  // ✅ gender register 커스터마이징 (타입 에러 해결 버전)
  const genderRegister = useMemo<GenderRegisterProps>(() => {
    const base = register("gender");

    return {
      ...base,

      // ✅ 핵심 1) 파라미터 타입을 RHF onChange와 동일하게 맞춤
      // ✅ 핵심 2) base.onChange(e)를 return 해서 Promise 타입까지 대응
      onChange: ((e) => {
        const value = (e.target as HTMLInputElement | undefined)?.value;
        setHasGender(!!value);
        return base.onChange(e);
      }) as typeof base.onChange,
    };
  }, [register]);

  const handleNumericChange = useCallback(
    (field: "height" | "weight", raw: string, focusNext?: () => void) => {
      const digits = raw.replace(/\D/g, "").slice(0, 3);

      if (!digits) {
        setValue(field, "");
        if (field === "height") setHeightValue("");
        else setWeightValue("");
        return;
      }

      const parsed = parseInt(digits, 10);
      if (!parsed || parsed < 1) return;

      const normalized = String(parsed);
      setValue(field, normalized, { shouldDirty: true, shouldValidate: true });

      if (field === "height") setHeightValue(normalized);
      else setWeightValue(normalized);

      if (normalized.length === 3 && focusNext) focusNext();
    },
    [setValue],
  );

  const handleHeightChange = useCallback(
    (value: string) => {
      handleNumericChange("height", value, () =>
        weightInputRef.current?.focus(),
      );
    },
    [handleNumericChange],
  );

  const handleWeightChange = useCallback(
    (value: string) => {
      handleNumericChange("weight", value);
    },
    [handleNumericChange],
  );

  const toggleStyle = useCallback((style: string) => {
    setStyles((prev) => {
      if (prev.includes(style)) {
        setStyleError(null);
        return prev.filter((s) => s !== style);
      }

      if (prev.length >= 2) {
        if (styleErrorTimeoutRef.current) {
          clearTimeout(styleErrorTimeoutRef.current);
        }

        setStyleError("스타일은 최대 2개까지 선택 가능합니다.");
        styleErrorTimeoutRef.current = setTimeout(() => {
          setStyleError(null);
        }, 2000);

        return prev;
      }

      setStyleError(null);
      return [...prev, style];
    });
  }, []);

  const handleShowPrivacy = useCallback(() => setShowPrivacyModal(true), []);
  const handleShowTerms = useCallback(() => setShowTermsModal(true), []);
  const handleCloseModal = useCallback(() => {
    setShowPrivacyModal(false);
    setShowTermsModal(false);
  }, []);

  const handleBack = useCallback(() => router.back(), [router]);

  const onSubmit = useCallback(
    (data: SignupStep2Values) => {
      console.log("Step2 data:", { ...data, styles });
      router.push("/home");
    },
    [router, styles],
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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="min-h-screen px-6 py-8">
      <Header onBack={handleBack} />
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
        onShowPrivacy={handleShowPrivacy}
        onShowTerms={handleShowTerms}
      />

      {showPrivacyModal && (
        <PolicyModal
          title="개인정보 처리방침"
          content={PRIVACY_POLICY_TEXT}
          onClose={handleCloseModal}
        />
      )}

      {showTermsModal && (
        <PolicyModal
          title="서비스 이용 약관"
          content={TERMS_OF_SERVICE_TEXT}
          onClose={handleCloseModal}
        />
      )}

      <Button
        type="submit"
        disabled={isSubmitDisabled}
        className={`mt-12 h-14 w-full text-base font-semibold ${
          isSubmitDisabled
            ? "bg-gray-200 text-gray-500 hover:bg-gray-200"
            : "bg-black text-white hover:bg-black"
        }`}
      >
        완료
      </Button>
    </form>
  );
}
