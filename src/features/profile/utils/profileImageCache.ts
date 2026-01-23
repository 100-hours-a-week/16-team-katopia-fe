const PROFILE_IMAGE_CACHE_KEY = "katopia.profileImageUrl";

export function isRemoteUrl(url: string) {
  return /^https?:\/\//i.test(url);
}

export function getCachedProfileImage() {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(PROFILE_IMAGE_CACHE_KEY);
  } catch {
    return null;
  }
}

export function setCachedProfileImage(value: string | null) {
  if (typeof window === "undefined") return;
  try {
    if (value) {
      localStorage.setItem(PROFILE_IMAGE_CACHE_KEY, value);
    } else {
      localStorage.removeItem(PROFILE_IMAGE_CACHE_KEY);
    }
  } catch {
    // Ignore storage errors (quota/private mode).
  }
}
