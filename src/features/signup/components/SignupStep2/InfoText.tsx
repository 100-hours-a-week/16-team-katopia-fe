"use client";

import { memo } from "react";

const InfoText = memo(() => (
  <p className="mt-6 text-[12px] text-muted-foreground text-center">
    선호 스타일과 키, 몸무게를 입력하면
    <br />더 정확한 추천이 가능합니다
  </p>
));

InfoText.displayName = "InfoText";
export default InfoText;
