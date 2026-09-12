"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactElement, type ReactNode } from "react";

interface AnimatedRevealProps {
  children: ReactNode;
  className?: string;
  delayMs?: number;
}

const AnimatedReveal = ({ children, className, delayMs = 0 }: AnimatedRevealProps): ReactElement => {
  const elementRef = useRef<HTMLDivElement | null>(null);
  const hasAnimatedRef = useRef(false);
  const previousScrollYRef = useRef(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useLayoutEffect(() => {
    const el = elementRef.current;

    if (!el) {
      return;
    }

    previousScrollYRef.current = window.scrollY;
    setIsMobile(window.matchMedia("(max-width: 639px)").matches);
    const triggerLineY = window.innerHeight * (2 / 3);
    const { top } = el.getBoundingClientRect();

    if (top <= triggerLineY) {
      hasAnimatedRef.current = true;
      setIsRevealed(true);
      el.style.opacity = "1";
      el.style.transform = "translateX(0px) translateY(0px)";
    }
  }, []);

  useEffect(() => {
    const el = elementRef.current;

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

          if (reduceMotion) {
            hasAnimatedRef.current = true;
            setIsRevealed(true);
            el.style.opacity = "1";
            el.style.transform = "translateX(0px) translateY(0px)";

            break;
          }

          const keyframes = isMobile
            ? [
                { opacity: 0, transform: "translateY(28px)" },
                { opacity: 1, transform: "translateY(0px)" },
              ]
            : [
                { opacity: 0, transform: "translateX(28px)" },
                { opacity: 1, transform: "translateX(0px)" },
              ];

          const animation = el.animate(keyframes, {
            delay: delayMs,
            duration: 850,
            easing: "cubic-bezier(0.22, 1, 0.36, 1)",
            fill: "forwards",
          });

          animation.onfinish = (): void => {
            hasAnimatedRef.current = true;
            setIsRevealed(true);
            el.style.opacity = "1";
            el.style.transform = "translateX(0px) translateY(0px)";
          };

          break;
        }
      },
      { threshold: 0, rootMargin: "0px 0px -33% 0px" },
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, [delayMs]);

  return (
    <div
      ref={elementRef}
      className={className}
      style={
        isRevealed
          ? { opacity: 1, transform: "translateX(0px) translateY(0px)" }
          : isMobile
            ? { opacity: 0, transform: "translateY(28px)" }
            : { opacity: 0, transform: "translateX(28px) translateY(0px)" }
      }
    >
      {children}
    </div>
  );
};

export default AnimatedReveal;
