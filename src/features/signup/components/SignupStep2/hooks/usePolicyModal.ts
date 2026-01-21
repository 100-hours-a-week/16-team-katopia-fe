import { useState } from "react";

export function usePolicyModal() {
  const [type, setType] = useState<"privacy" | "terms" | null>(null);

  return {
    type,
    showPrivacy: () => setType("privacy"),
    showTerms: () => setType("terms"),
    close: () => setType(null),
  };
}
