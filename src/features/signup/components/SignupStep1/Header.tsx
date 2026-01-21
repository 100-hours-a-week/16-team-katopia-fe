import { memo } from "react";
import { Progress } from "@/components/ui/progress";

const Header = memo(() => (
  <>
    <div className="text-center">
      <h1 className="text-lg font-semibold">가입하기</h1>
      <p className="mt-1 text-sm text-muted-foreground">일반 정보</p>
    </div>

    <div className="mt-6 flex justify-center">
      <Progress value={50} className="w-3/4" />
    </div>
  </>
));

Header.displayName = "Header";
export default Header;
