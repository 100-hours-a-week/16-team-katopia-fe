"use client";

import { memo } from "react";

const Toast = memo(({ message }: { message: string | null }) => {
  if (!message) return null;

  return (
    <div className="fixed bottom-25 left-1/2 z-100 -translate-x-1/2 px-4">
      <div
        className="min-w-65 rounded-full bg-white px-8 py-3 text-center text-base font-semibold text-[#121212] shadow-lg"
        style={{ animation: "toastFadeIn 250ms ease-out forwards" }}
      >
        {message}
      </div>
    </div>
  );
});

Toast.displayName = "Toast";

export default Toast;
