"use client";

import { memo } from "react";
import { Progress } from "@/components/ui/progress";

const ProgressBar = memo(() => (
  <div className="mt-6 flex justify-center">
    <Progress value={100} className="w-3/4" />
  </div>
));

ProgressBar.displayName = "ProgressBar";
export default ProgressBar;
