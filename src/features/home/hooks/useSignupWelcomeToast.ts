import { useEffect, useRef, useState } from "react";

export function useSignupWelcomeToast() {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const message = window.localStorage.getItem("katopia.signupWelcome");
      if (!message) return;
      window.localStorage.removeItem("katopia.signupWelcome");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setToastMessage(message);
      toastTimerRef.current = setTimeout(() => {
        setToastMessage(null);
      }, 1200);
    } catch {
      // ignore storage errors
    }

    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  return toastMessage;
}
