export const isMobileOrTabletClient = (): boolean => {
  if (typeof window === "undefined") {
    return true;
  }

  if (import.meta.env.DEV) {
    return true;
  }

  if (import.meta.env.VITE_MOBILE_ALLOW_DESKTOP === "true") {
    return true;
  }

  const ua = navigator.userAgent || "";
  const isIPadOS = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;

  if (/iPhone|iPod|Android.*Mobile|webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua)) {
    return true;
  }

  if (isIPadOS) {
    return true;
  }

  if (/iPad|Tablet|PlayBook|Silk|Kindle/i.test(ua)) {
    return true;
  }

  if (/Android/i.test(ua) && !/Mobile/i.test(ua)) {
    return true;
  }

  if (window.matchMedia("(max-width: 1024px)").matches && (navigator.maxTouchPoints > 0 || "ontouchstart" in window)) {
    return true;
  }

  return false;
};
