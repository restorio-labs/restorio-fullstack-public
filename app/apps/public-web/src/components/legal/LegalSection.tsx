"use client";

import { Stack, Text } from "@restorio/ui";
import { useEffect, useLayoutEffect, useRef, type ReactElement } from "react";

import { useTranslations } from "@/i18n/useT";

interface CookieTypeItem {
  name: string;
  description: string;
  examples: string;
}

interface LegalSectionMessages {
  title?: string;
  content?: string[];
  items?: Record<string, string | CookieTypeItem>;
}

interface LegalSectionProps {
  id: string;
  namespace: string;
}

export const LegalSection = ({ id, namespace }: LegalSectionProps): ReactElement => {
  const t = useTranslations("legal");
  const section = t.raw(namespace) as LegalSectionMessages;
  const sectionRef = useRef<HTMLElement | null>(null);
  const hasAnimatedRef = useRef(false);
  const previousScrollYRef = useRef(0);
  let renderedItems: ReactElement | null = null;

  useLayoutEffect(() => {
    const el = sectionRef.current;

    if (!el) {
      return;
    }

    previousScrollYRef.current = window.scrollY;
    const triggerLineY = window.innerHeight * (2 / 3);
    const { top } = el.getBoundingClientRect();
    const isInsideTriggerZone = top <= triggerLineY;

    if (!isInsideTriggerZone) {
      const isMobile = window.matchMedia("(max-width: 639px)").matches;

      el.style.opacity = "0";
      el.style.transform = isMobile ? "translateY(28px)" : "translateX(28px)";

      return;
    }
  }, []);

  useEffect(() => {
    const el = sectionRef.current;

    if (!el) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting || hasAnimatedRef.current) {
            continue;
          }

          const currentScrollY = window.scrollY;
          const isScrollingDown = currentScrollY > previousScrollYRef.current;

          previousScrollYRef.current = currentScrollY;

          if (!isScrollingDown) {
            continue;
          }

          const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
          const isMobile = window.matchMedia("(max-width: 639px)").matches;
          const keyframes = isMobile
            ? [
                { opacity: 0, transform: "translateY(28px)" },
                { opacity: 1, transform: "translateY(0px)" },
              ]
            : [
                { opacity: 0, transform: "translateX(28px)" },
                { opacity: 1, transform: "translateX(0px)" },
              ];

          if (reduceMotion) {
            el.style.opacity = "1";
            el.style.transform = "translateX(0px) translateY(0px)";
            hasAnimatedRef.current = true;

            break;
          }

          const animation = el.animate(keyframes, {
            duration: 900,
            easing: "cubic-bezier(0.22, 1, 0.36, 1)",
            fill: "forwards",
          });

          animation.onfinish = (): void => {
            el.style.opacity = "1";
            el.style.transform = "translateX(0px) translateY(0px)";
          };

          hasAnimatedRef.current = true;

          break;
        }
      },
      { threshold: 0, rootMargin: "0px 0px -33% 0px" },
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, []);

  if (section.items) {
    const entries = Object.entries(section.items);

    if (entries.length > 0) {
      const firstValue = entries[0]?.[1];

      if (typeof firstValue === "string") {
        renderedItems = (
          <dl className="mt-2 space-y-2">
            {Object.entries(section.items).map(([key, value]) => (
              <div key={key}>
                <dt className="font-medium text-text-primary">{key}</dt>
                <dd className="text-sm text-text-secondary">{value as string}</dd>
              </div>
            ))}
          </dl>
        );
      } else {
        renderedItems = (
          <div className="not-prose mt-2 grid gap-4 md:grid-cols-2">
            {Object.entries(section.items).map(([key, value]) => {
              if (typeof value === "string") {
                return null;
              }

              return (
                <div key={key} className="rounded-lg border border-border-subtle bg-surface-primary p-4">
                  <h4 className="mb-1 text-base font-semibold">{value.name}</h4>
                  <p className="mb-1 text-sm text-text-secondary">{value.description}</p>
                  <p className="text-xs text-text-secondary">
                    <span className="font-medium">Przykłady: </span>
                    {value.examples}
                  </p>
                </div>
              );
            })}
          </div>
        );
      }
    }
  }

  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      ref={sectionRef}
      className="scroll-mt-24 border-border-subtle border-t pt-10 first:border-t-0 first:pt-0 mb-16"
    >
      <Stack spacing="sm" className="mt-4">
        <Text id={`${id}-title`} as="h2" variant="h4" weight="semibold">
          {section.title ?? t(`${namespace}.title`)}
        </Text>
        <div className="border-l-2 border-border-subtle m-4 space-y-2" style={{ paddingLeft: "1rem" }}>
          {Array.isArray(section.content) &&
            section.content.map((paragraph) => (
              <Text key={paragraph} as="p" variant="body-md" className="text-text-secondary leading-relaxed">
                {paragraph}
              </Text>
            ))}
          {renderedItems}
        </div>
      </Stack>
    </section>
  );
};
