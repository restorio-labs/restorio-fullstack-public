import { useEffect } from "react";

const GOOGLE_FONT_LINK_ID = "tenant-google-font-stylesheet";

export const useGoogleFontStylesheet = (href: string | undefined): void => {
  useEffect(() => {
    const trimmed = href?.trim();

    if (!trimmed) {
      document.getElementById(GOOGLE_FONT_LINK_ID)?.remove();

      return;
    }

    let link = document.getElementById(GOOGLE_FONT_LINK_ID) as HTMLLinkElement | null;

    if (!link) {
      link = document.createElement("link");
      link.id = GOOGLE_FONT_LINK_ID;
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }

    link.href = trimmed;

    return (): void => {
      document.getElementById(GOOGLE_FONT_LINK_ID)?.remove();
    };
  }, [href]);
};
