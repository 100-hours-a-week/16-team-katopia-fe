"use client";

import { memo, useCallback, useMemo, useRef } from "react";
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
  styles: string[];
  styleError: string | null;
  onToggleStyle: (style: string) => void;
  privacyChecked: boolean;
  termsChecked: boolean;
  onPrivacyChange: (next: boolean) => void;
  onTermsChange: (next: boolean) => void;
  modals: {
    showPrivacyModal: boolean;
    showTermsModal: boolean;
    setShowPrivacyModal: (next: boolean) => void;
    setShowTermsModal: (next: boolean) => void;
  };
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

const TermsField = memo(
  ({
    privacyChecked,
    termsChecked,
    onPrivacyChange,
    onTermsChange,
    onShowPrivacy,
    onShowTerms,
  }: {
    privacyChecked: boolean;
    termsChecked: boolean;
    onPrivacyChange: (next: boolean) => void;
    onTermsChange: (next: boolean) => void;
    onShowPrivacy: () => void;
    onShowTerms: () => void;
  }) => (
    <TermsSection
      privacyChecked={privacyChecked}
      termsChecked={termsChecked}
      onPrivacyChange={onPrivacyChange}
      onTermsChange={onTermsChange}
      onShowPrivacy={onShowPrivacy}
      onShowTerms={onShowTerms}
    />
  ),
);

TermsField.displayName = "TermsField";

export default function SignupStep2View({
  form,
  onSubmit,
  onBack,
  styles,
  styleError,
  onToggleStyle,
  privacyChecked,
  termsChecked,
  onPrivacyChange,
  onTermsChange,
  modals,
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

        <StyleSection styles={styles} onToggle={onToggleStyle} error={styleError} />

        <TermsField
          privacyChecked={privacyChecked}
          termsChecked={termsChecked}
          onPrivacyChange={onPrivacyChange}
          onTermsChange={onTermsChange}
          onShowPrivacy={() => modals.setShowPrivacyModal(true)}
          onShowTerms={() => modals.setShowTermsModal(true)}
        />

        {modals.showPrivacyModal && (
          <PolicyModal
            title="개인정보 처리방침"
            content={PRIVACY_POLICY_TEXT}
            onClose={() => modals.setShowPrivacyModal(false)}
          />
        )}

        {modals.showTermsModal && (
          <PolicyModal
            title="서비스 이용 약관"
            content={TERMS_OF_SERVICE_TEXT}
            onClose={() => modals.setShowTermsModal(false)}
          />
        )}

        <SubmitButton
          privacyChecked={privacyChecked}
          termsChecked={termsChecked}
        />
      </form>
    </FormProvider>
  );
}
