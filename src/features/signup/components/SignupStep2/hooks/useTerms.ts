import { useState } from "react";

export function useTerms() {
  const [privacy, setPrivacy] = useState(false);
  const [terms, setTerms] = useState(false);

  return {
    privacy,
    terms,
    setPrivacy,
    setTerms,
    isValid: privacy && terms,
  };
}
