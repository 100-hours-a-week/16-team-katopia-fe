"use client";

import { useRouter } from "next/navigation";

import SignupStep2View from "./SignupStep2View";
import { useSignupStep2 } from "./hooks/useSignupStep2";

export default function SignupStep2() {
  const router = useRouter();
  const {
    form,
    onSubmit,
    styles,
    styleError,
    toggleStyle,
    privacyChecked,
    termsChecked,
    setPrivacyChecked,
    setTermsChecked,
    modals,
  } = useSignupStep2();

  return (
    <SignupStep2View
      form={form}
      onSubmit={onSubmit}
      onBack={() => router.back()}
      styles={styles}
      styleError={styleError}
      onToggleStyle={toggleStyle}
      privacyChecked={privacyChecked}
      termsChecked={termsChecked}
      onPrivacyChange={setPrivacyChecked}
      onTermsChange={setTermsChecked}
      modals={modals}
    />
  );
}
