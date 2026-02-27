import { useEffect, useRef } from "react";

export function useHomeScrollRestoration(postsLength: number) {
  const restoreAttemptedRef = useRef(false);
  const pendingScrollYRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const key = "katopia.home.scrollY";
    const readScroll = () => {
      try {
        const stored = window.sessionStorage.getItem(key);
        if (!stored) return null;
        const y = Number(stored);
        return Number.isFinite(y) ? y : null;
      } catch {
        return null;
      }
    };

    pendingScrollYRef.current = readScroll();

    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    const saveScroll = () => {
      try {
        window.sessionStorage.setItem(key, String(window.scrollY));
      } catch {
        // ignore storage errors
      }
    };
    const onScroll = () => {
      saveScroll();
    };
    const onPageHide = () => {
      saveScroll();
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        saveScroll();
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pagehide", onPageHide);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pagehide", onPageHide);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      try {
        window.sessionStorage.setItem(key, String(window.scrollY));
      } catch {
        // ignore storage errors
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (restoreAttemptedRef.current) return;
    const targetY = pendingScrollYRef.current;
    if (targetY == null) return;

    let tries = 0;
    const maxTries = 40;
    let intervalId: number | null = null;

    const attempt = () => {
      const doc = document.documentElement;
      const canScroll = doc.scrollHeight >= targetY + window.innerHeight - 20;

      if (canScroll || tries >= maxTries) {
        window.scrollTo(0, targetY);
        restoreAttemptedRef.current = true;
        if (intervalId != null) {
          window.clearInterval(intervalId);
        }
        return;
      }

      tries += 1;
      requestAnimationFrame(attempt);
    };

    requestAnimationFrame(attempt);
    intervalId = window.setInterval(attempt, 200);
    const onLoad = () => attempt();
    window.addEventListener("load", onLoad);

    return () => {
      if (intervalId != null) {
        window.clearInterval(intervalId);
      }
      window.removeEventListener("load", onLoad);
    };
  }, [postsLength]);
}
