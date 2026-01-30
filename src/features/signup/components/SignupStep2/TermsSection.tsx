"use client";
"use client";

import { memo } from "react";
import { Checkbox } from "@/components/ui/checkbox";

type Props = {
  privacyChecked: boolean;
  termsChecked: boolean;
  onPrivacyChange: (v: boolean) => void;
  onTermsChange: (v: boolean) => void;
  onShowPrivacy: () => void;
  onShowTerms: () => void;
};

const TermsSection = memo(
  ({
    privacyChecked,
    termsChecked,
    onPrivacyChange,
    onTermsChange,
    onShowPrivacy,
    onShowTerms,
  }: Props) => (
    <div className="mt-10 rounded bg-muted p-4 opacity-60">
      <div className="flex items-center gap-2">
        <Checkbox
          checked={privacyChecked}
          onCheckedChange={(v) => onPrivacyChange(!!v)}
          className="border-[#121212] bg-white data-[state=checked]:bg-black"
        />
        <span className="text-[13px]">[필수] 개인정보 처리방침</span>
        <button
          type="button"
          onClick={onShowPrivacy}
          className="ml-auto text-xs underline"
        >
          자세히 &gt;
        </button>
      </div>

      <div className="mt-2 flex items-center gap-2">
        <Checkbox
          checked={termsChecked}
          onCheckedChange={(v) => onTermsChange(!!v)}
          className="border-[#121212] bg-white data-[state=checked]:bg-black"
        />
        <span className="text-[13px]">[필수] 서비스 이용 약관</span>
        <button
          type="button"
          onClick={onShowTerms}
          className="ml-auto text-xs underline"
        >
          자세히 &gt;
        </button>
      </div>
    </div>
  ),
);

TermsSection.displayName = "TermsSection";
export default TermsSection;
