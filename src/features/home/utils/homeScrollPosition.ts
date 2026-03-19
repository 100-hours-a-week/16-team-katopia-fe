const HOME_SCROLL_KEY = "katopia.home.scrollY";

export function saveHomeScrollPosition() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(HOME_SCROLL_KEY, String(window.scrollY));
  } catch {
    // ignore storage errors
  }
}

export function readHomeScrollPosition() {
  if (typeof window === "undefined") return null;
  try {
    const stored = window.sessionStorage.getItem(HOME_SCROLL_KEY);
    if (!stored) return null;
    const y = Number(stored);
    return Number.isFinite(y) ? y : null;
  } catch {
    return null;
  }
}
