"use client";

import { memo, useCallback, useMemo, useRef, useState } from "react";
import type { MutableRefObject } from "react";
import dynamic from "next/dynamic";
import {
  FormProvider,
  useController,
  useFormContext,
  useFormState,
  useWatch,
  type UseFormReturn,
} from "react-hook-form";

import { Button } from "@/components/ui/button";
import Header from "./Header";
import ProgressBar from "./ProgressBar";
import InfoText from "./InfoText";
import GenderSection from "./GenderSection";
import BodyInfoSection from "./BodyInfoSection";
import StyleSection from "./StyleSection";
import TermsSection from "./TermsSection";
import {
  PRIVACY_POLICY_TEXT,
  TERMS_OF_SERVICE_TEXT,
} from "../constants/policies";
import type { SignupStep2Values } from "./hooks/useSignupStep2";

const PolicyModal = dynamic(() => import("./PolicyModal"), { ssr: false });

type Props = {
  form: UseFormReturn<SignupStep2Values>;
  onSubmit: (values: SignupStep2Values) => void | Promise<void>;
  onBack: () => void;
  stylesRef: MutableRefObject<string[]>;
  setStylesRef: (next: string[]) => void;
  styleErrorTimeoutRef: MutableRefObject<NodeJS.Timeout | null>;
};

const GenderField = memo(() => {
  const { register } = useFormContext<SignupStep2Values>();
  const { errors } = useFormState<SignupStep2Values>({
    name: "gender",
  });

  return (
    <GenderSection
      register={register("gender")}
      error={errors.gender?.message}
    />
  );
});

GenderField.displayName = "GenderField";

const BodyInfoField = memo(() => {
  const { control, setValue } = useFormContext<SignupStep2Values>();
  const { field: heightField } = useController({
    name: "height",
    control,
  });
  const { field: weightField } = useController({
    name: "weight",
    control,
  });
  const { errors } = useFormState<SignupStep2Values>({
    name: ["height", "weight"],
  });

  const weightInputRef = useRef<HTMLInputElement | null>(null);

  const handleNumericChange = useCallback(
    (field: "height" | "weight", raw: string, focusNext?: () => void) => {
      const digits = raw.replace(/\D/g, "").slice(0, 3);
      const normalized = digits ? String(parseInt(digits, 10)) : "";

      setValue(field, normalized, { shouldDirty: true, shouldValidate: true });

      if (normalized.length === 3 && focusNext) focusNext();
    },
    [setValue],
  );

  const onHeightChange = useCallback(
    (value: string) =>
      handleNumericChange("height", value, () =>
        weightInputRef.current?.focus(),
      ),
    [handleNumericChange],
  );

  const onWeightChange = useCallback(
    (value: string) => handleNumericChange("weight", value),
    [handleNumericChange],
  );

  return (
    <BodyInfoSection
      heightValue={heightField.value ?? ""}
      weightValue={weightField.value ?? ""}
      onHeightChange={onHeightChange}
      onWeightChange={onWeightChange}
      weightInputRef={weightInputRef}
      heightError={errors.height?.message as string | undefined}
      weightError={errors.weight?.message as string | undefined}
    />
  );
});

BodyInfoField.displayName = "BodyInfoField";

const SubmitButton = memo(
  ({
    privacyChecked,
    termsChecked,
  }: {
    privacyChecked: boolean;
    termsChecked: boolean;
  }) => {
    const { control } = useFormContext<SignupStep2Values>();
    const gender = useWatch({ control, name: "gender" });
    const { errors } = useFormState<SignupStep2Values>({
      name: ["gender", "height", "weight"],
    });

    const isDisabled =
      !gender ||
      !privacyChecked ||
      !termsChecked ||
      Boolean(errors.gender) ||
      Boolean(errors.height) ||
      Boolean(errors.weight);

    return (
      <Button
        type="submit"
        disabled={isDisabled}
        className={`mt-12 h-14 w-full text-base font-semibold ${
          isDisabled ? "bg-gray-200 text-gray-500" : "bg-black text-white"
        }`}
      >
        완료
      </Button>
    );
  },
);

SubmitButton.displayName = "SubmitButton";

const TermsAgreement = memo(() => {
  const [privacyChecked, setPrivacyChecked] = useState(false);
  const [termsChecked, setTermsChecked] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  return (
    <>
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

      <SubmitButton
        privacyChecked={privacyChecked}
        termsChecked={termsChecked}
      />
    </>
  );
});

TermsAgreement.displayName = "TermsAgreement";

const StyleField = memo(
  ({
    stylesRef,
    setStylesRef,
    styleErrorTimeoutRef,
  }: {
    stylesRef: MutableRefObject<string[]>;
    setStylesRef: (next: string[]) => void;
    styleErrorTimeoutRef: MutableRefObject<NodeJS.Timeout | null>;
  }) => {
    // eslint-disable-next-line react-hooks/refs
    const [styles, setStyles] = useState<string[]>(stylesRef.current);
    const [styleError, setStyleError] = useState<string | null>(null);

    const toggleStyle = useCallback(
      (style: string) => {
        setStyles((prev) => {
          if (prev.includes(style)) {
            const next = prev.filter((s) => s !== style);
            setStylesRef(next);
            return next;
          }

          if (prev.length >= 2) {
            setStyleError("스타일은 최대 2개까지 선택 가능합니다.");
            styleErrorTimeoutRef.current = setTimeout(
              () => setStyleError(null),
              2000,
            );
            return prev;
          }

          const next = [...prev, style];
          setStylesRef(next);
          return next;
        });
      },
      [setStylesRef, styleErrorTimeoutRef],
    );

    return (
      <StyleSection styles={styles} onToggle={toggleStyle} error={styleError} />
    );
  },
);

StyleField.displayName = "StyleField";

export default function SignupStep2View({
  form,
  onSubmit,
  onBack,
  stylesRef,
  setStylesRef,
  styleErrorTimeoutRef,
}: Props) {
  const handleSubmit = useMemo(
    () => form.handleSubmit(onSubmit),
    [form, onSubmit],
  );

  return (
    <FormProvider {...form}>
      <form onSubmit={handleSubmit} className="min-h-screen px-6 py-8">
        <Header onBack={onBack} />
        <ProgressBar />
        <InfoText />

        <GenderField />

        <BodyInfoField />

        <StyleField
          stylesRef={stylesRef}
          setStylesRef={setStylesRef}
          styleErrorTimeoutRef={styleErrorTimeoutRef}
        />

        <TermsAgreement />
      </form>
    </FormProvider>
  );
}
