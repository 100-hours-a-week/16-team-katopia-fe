import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function useHomeQuerySync() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isActiveState = searchParams.get("STATE") === "ACTIVE";
  const isPendingSignup = searchParams.get("status") === "PENDING";

  useEffect(() => {
    if (!isActiveState) return;

    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("STATE");
    const nextQuery = nextParams.toString();
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname);
  }, [isActiveState, pathname, router, searchParams]);

  useEffect(() => {
    if (!isPendingSignup) return;
    router.replace("/signup/step1");
  }, [isPendingSignup, router]);
}
