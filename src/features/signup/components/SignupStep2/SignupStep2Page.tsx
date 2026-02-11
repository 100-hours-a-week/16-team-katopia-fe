"use client";

import { useRouter } from "next/navigation";

import SignupStep2View from "./SignupStep2View";
import { useSignupStep2 } from "./hooks/useSignupStep2";

export default function SignupStep2() {
  const router = useRouter();
  const { form, onSubmit, stylesRef, setStylesRef, styleErrorTimeoutRef } =
    useSignupStep2();

  return (
    <SignupStep2View
      form={form}
      onSubmit={onSubmit}
      onBack={() => router.back()}
      stylesRef={stylesRef}
      setStylesRef={setStylesRef}
      styleErrorTimeoutRef={styleErrorTimeoutRef}
    />
  );
}
