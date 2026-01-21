"use client";

import { memo } from "react";

type Props = {
  title: string;
  content: string;
  onClose: () => void;
};

const PolicyModal = memo(({ title, content, onClose }: Props) => (
  <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 px-6">
    <div className="flex h-[70vh] w-full max-w-md flex-col rounded-xl bg-white p-4 shadow-lg">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold">{title}</h2>
        <button type="button" className="text-sm" onClick={onClose}>
          닫기
        </button>
      </div>

      <div className="flex-1 overflow-y-auto whitespace-pre-line text-[13px] leading-relaxed text-muted-foreground">
        {content}
      </div>
    </div>
  </div>
));

PolicyModal.displayName = "PolicyModal";
export default PolicyModal;
