"use client";

import { cn, useAuthRoute, type AuthRouteStatus } from "@restorio/ui";
import { type ReactElement, useEffect, useState } from "react";
import { FaPlugCircleCheck, FaPlugCircleExclamation } from "react-icons/fa6";

import { useTranslations } from "@/i18n/useT";

const EXIT_MS = 320;

const isActiveStatus = (s: AuthRouteStatus): boolean => {
  return s === "reconnecting" || s === "unavailable";
};

export const ConnectionStatusBubble = (): ReactElement | null => {
  const t = useTranslations();
  const { authStatus } = useAuthRoute();
  const active = isActiveStatus(authStatus);
  const [mounted, setMounted] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [phase, setPhase] = useState<"reconnecting" | "unavailable">("reconnecting");

  useEffect(() => {
    if (active) {
      setPhase(authStatus === "reconnecting" ? "reconnecting" : "unavailable");
      setLeaving(false);
      setMounted(true);

      return;
    }

    if (!mounted) {
      return;
    }

    setLeaving(true);
    const id = window.setTimeout(() => {
      setMounted(false);
      setLeaving(false);
    }, EXIT_MS);

    return () => {
      window.clearTimeout(id);
    };
  }, [active, authStatus, mounted]);

  if (!mounted) {
    return null;
  }

  const isReconnecting = phase === "reconnecting";

  return (
    <div className="fixed bottom-4 right-4 z-50 flex shrink-0 justify-end">
      <div className="relative w-max max-w-[calc(100vw-2rem)] overflow-x-auto rounded-2xl p-[2px] connection-status-glow-ring">
        <div
          role={isReconnecting ? "status" : "alert"}
          className={cn(
            "rounded-2xl relative inline-flex max-w-full flex-nowrap items-center gap-3 whitespace-nowrap border border-border-default bg-surface-primary px-4 py-3 text-left text-sm text-text-primary shadow-lg",
            leaving ? "connection-status-bubble-leave" : "connection-status-bubble-enter",
          )}
        >
          {isReconnecting ? (
            <FaPlugCircleCheck className="h-5 w-5 shrink-0 text-status-success-text" aria-hidden />
          ) : (
            <FaPlugCircleExclamation className="h-5 w-5 shrink-0 text-text-primary" aria-hidden />
          )}
          <span className="shrink-0 leading-snug text-text-primary">
            {isReconnecting ? t("common.tryingToConnect") : t("common.backendUnavailable")}
          </span>
        </div>
      </div>
    </div>
  );
};
