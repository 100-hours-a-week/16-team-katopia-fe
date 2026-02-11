"use client";

import { memo, useCallback } from "react";
import Image from "next/image";

import {
  useHeaderBackState,
  useHeaderSubmitState,
} from "../../hooks/useProfileEditHeaderState";

export type HeaderSharedProps = {
  onBackImmediate: () => void;
  setShowCancelModal: (next: boolean) => void;
  imageBlob: Blob | null;
  removeImage: boolean;
  initialStyles: string[];
  subscribeStyles: (listener: () => void) => () => void;
  getStylesSnapshot: () => string[];
};

const HeaderBackButton = memo((props: HeaderSharedProps) => {
  const { hasChanges } = useHeaderBackState(props);
  const { onBackImmediate, setShowCancelModal } = props;
  const handleBack = useCallback(() => {
    if (hasChanges) {
      setShowCancelModal(true);
      return;
    }
    onBackImmediate();
  }, [hasChanges, onBackImmediate, setShowCancelModal]);

  return (
    <button type="button" aria-label="뒤로가기" onClick={handleBack}>
      <Image src="/icons/back.svg" alt="뒤로가기" width={24} height={24} />
    </button>
  );
});

HeaderBackButton.displayName = "HeaderBackButton";

const HeaderSubmitButton = memo((props: HeaderSharedProps) => {
  const { hasChanges, hasRequiredValues } = useHeaderSubmitState(props);

  return (
    <button
      type="submit"
      disabled={!hasChanges || !hasRequiredValues}
      className={`text-[14px] font-semibold ${
        hasChanges && hasRequiredValues ? "text-black" : "text-gray-300"
      }`}
    >
      완료
    </button>
  );
});

HeaderSubmitButton.displayName = "HeaderSubmitButton";

const ProfileEditHeader = memo((props: HeaderSharedProps) => (
  <header className="flex items-center justify-between px-4 py-3">
    <HeaderBackButton {...props} />
    <h1 className="text-[14px] font-semibold">프로필 수정</h1>
    <HeaderSubmitButton {...props} />
  </header>
));

ProfileEditHeader.displayName = "ProfileEditHeader";

export default ProfileEditHeader;
