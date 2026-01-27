import { memo } from "react";
import { Button } from "@/components/ui/button";

const SubmitButton = memo(({ disabled }: { disabled: boolean }) => (
  <Button
    type="submit"
    disabled={disabled}
    className={`mt-40 h-14 w-full text-base font-semibold ${
      disabled
        ? "bg-gray-200 text-gray-500 hover:bg-gray-200"
        : "bg-black text-white hover:bg-black"
    }`}
  >
    다음
  </Button>
));

SubmitButton.displayName = "SubmitButton";
export default SubmitButton;
