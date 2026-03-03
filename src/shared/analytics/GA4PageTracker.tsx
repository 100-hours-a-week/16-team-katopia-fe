"use client";

import { useCallback, useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { sendGAEvent } from "@next/third-parties/google";

function getPagePath(pathname: string, searchParams: URLSearchParams) {
  const query = searchParams.toString();
  return query ? `${pathname}?${query}` : pathname;
}

function getPageTitle(pathname: string, currentPath: string) {
  if (typeof document === "undefined") return pathname || currentPath || "/";
  const title = document.title?.trim();
  return title || pathname || currentPath || "/";
}

function getSiteDomain() {
  if (typeof window === "undefined") return undefined;
  return window.location.hostname || undefined;
}

type GA4PageTrackerProps = {
  gaId: string;
};

type GAEventParams = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    gtag?: (
      command: "event",
      eventName: string,
      eventParams?: GAEventParams,
    ) => void;
  }
}

export default function GA4PageTracker({ gaId }: GA4PageTrackerProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const pageEnterAtRef = useRef<number>(0);
  const lastPathRef = useRef<string>("");
  const scrollTrackedRef = useRef<{ fifty: boolean; ninety: boolean }>({
    fifty: false,
    ninety: false,
  });

  const trackEvent = useCallback(
    (eventName: string, params: GAEventParams) => {
      if (typeof window !== "undefined" && typeof window.gtag === "function") {
        window.gtag("event", eventName, {
          ...params,
          send_to: gaId,
        });
        return;
      }
      sendGAEvent("event", eventName, {
        ...params,
        send_to: gaId,
      });
    },
    [gaId],
  );

  useEffect(() => {
    const currentPath = getPagePath(pathname ?? "/", searchParams);
    const currentTitle = getPageTitle(pathname ?? "/", currentPath);
    const siteDomain = getSiteDomain();
    const previousPath = lastPathRef.current;

    // 이전 페이지 체류 시간을 페이지 전환 시점에 기록
    if (previousPath) {
      const elapsed = Date.now() - pageEnterAtRef.current;
      trackEvent("page_dwell", {
        page_path: previousPath,
        engagement_time_msec: elapsed,
        site_domain: siteDomain,
      });
    }

    pageEnterAtRef.current = Date.now();
    lastPathRef.current = currentPath;
    scrollTrackedRef.current = { fifty: false, ninety: false };

    trackEvent("page_view", {
      page_path: currentPath,
      page_location: window.location.href,
      page_title: currentTitle,
      site_domain: siteDomain,
    });
  }, [pathname, searchParams, trackEvent]);

  useEffect(() => {
    const handleScroll = () => {
      const doc = document.documentElement;
      const scrollTop = window.scrollY;
      const maxScrollable = Math.max(doc.scrollHeight - window.innerHeight, 1);
      const ratio = (scrollTop / maxScrollable) * 100;
      const currentPath = lastPathRef.current || pathname || "/";

      if (ratio >= 50 && !scrollTrackedRef.current.fifty) {
        scrollTrackedRef.current.fifty = true;
        trackEvent("scroll_depth", {
          page_path: currentPath,
          percent_scrolled: 50,
          site_domain: getSiteDomain(),
        });
      }

      if (ratio >= 90 && !scrollTrackedRef.current.ninety) {
        scrollTrackedRef.current.ninety = true;
        trackEvent("scroll_depth", {
          page_path: currentPath,
          percent_scrolled: 90,
          site_domain: getSiteDomain(),
        });
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [pathname, trackEvent]);

  useEffect(() => {
    return () => {
      if (!lastPathRef.current) return;
      const elapsed = Date.now() - pageEnterAtRef.current;
      trackEvent("page_dwell", {
        page_path: lastPathRef.current,
        engagement_time_msec: elapsed,
        site_domain: getSiteDomain(),
      });
    };
  }, [trackEvent]);

  return null;
}
