"use client";

import { useState } from "react";
import VoteCreateHeader from "./components/VoteCreateHeader";
import VoteCreateTitle from "./components/VoteCreateTitle";
import VoteTitleInput from "./components/VoteTitleInput";
import VoteImagePicker from "./components/VoteImagePicker";
import VoteSubmitButton from "./components/VoteSubmitButton";

export default function VoteCreatePage() {
  const [title, setTitle] = useState("");
  const [isOverLimit, setIsOverLimit] = useState(false);
  const [imageCount, setImageCount] = useState(0);
  const titleHelperText = isOverLimit
    ? "최대 20자까지 입력할 수 있어요."
    : null;

  const handleTitleChange = (next: string) => {
    if (next.length > 20) {
      setTitle(next.slice(0, 20));
      setIsOverLimit(true);
      return;
    }
    setIsOverLimit(false);
    setTitle(next);
  };

  const isTitleValid = title.trim().length > 0 && !isOverLimit;
  const canSubmit = isTitleValid && imageCount > 0;

  return (
    <div className="min-h-screen bg-white px-5 pb-[calc(env(safe-area-inset-bottom)+24px)] pt-6">
      <VoteCreateHeader />

      <section className="mt-8">
        <VoteCreateTitle />
        <VoteTitleInput
          value={title}
          onChange={handleTitleChange}
          isOverLimit={isOverLimit}
          helperText={titleHelperText}
        />
        <VoteImagePicker onCountChange={setImageCount} />
      </section>

      <div className="mt-10">
        <VoteSubmitButton disabled={!canSubmit} />
      </div>
    </div>
  );
}
