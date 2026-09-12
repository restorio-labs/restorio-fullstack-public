import type { AuthMeData, RefreshResponse } from "@restorio/types";
import type { ReactElement, ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";

import { AuthProvider } from "./AuthContext";
import type { UserRole } from "./RoleGuard";
import { TokenStorage } from "./storage";

interface AuthClient {
  auth: {
    me: () => Promise<AuthMeData>;
    refresh: () => Promise<RefreshResponse>;
  };
}

export type CheckAuthResult = boolean | AuthCheckResult;

export interface AuthGuardProps {
  children: ReactNode;
  loginPath?: string;
  redirectTo?: string;
  fallback?: ReactNode;
  checkAuth?: () => CheckAuthResult | Promise<CheckAuthResult>;
  revalidateIntervalMs?: number;
  revalidateOnFocus?: boolean;
  client?: AuthClient;
}

type AuthStatus = "pending" | "allowed" | "unauthorized";

const fallbackTokenCheck = (): boolean => {
  const accessToken = TokenStorage.getAccessToken();

  if (accessToken && TokenStorage.isAccessTokenValid(accessToken)) {
    return true;
  }

  const refreshToken = TokenStorage.getRefreshToken();

  return Boolean(refreshToken);
};

const REVALIDATION_COOLDOWN_MS = 2000;

interface AuthCheckResult {
  authorized: boolean;
  role: UserRole | null;
}

const createDefaultCheckAuth = (client: AuthClient | undefined): (() => AuthCheckResult | Promise<AuthCheckResult>) => {
  if (typeof window === "undefined" || !client) {
    return (): AuthCheckResult => ({ authorized: fallbackTokenCheck(), role: null });
  }

  return async (): Promise<AuthCheckResult> => {
    try {
      const meData = await client.auth.me();

      return { authorized: true, role: meData.account_type as UserRole | null };
    } catch {
      try {
        await client.auth.refresh();
        const meData = await client.auth.me();

        return { authorized: true, role: meData.account_type as UserRole | null };
      } catch {
        return { authorized: false, role: null };
      }
    }
  };
};

export const AuthGuard = ({
  children,
  loginPath = "/login",
  redirectTo,
  fallback = null,
  checkAuth,
  client,
  revalidateIntervalMs,
  revalidateOnFocus = true,
}: AuthGuardProps): ReactElement | null => {
  const [status, setStatus] = useState<AuthStatus>("pending");
  const [role, setRole] = useState<UserRole | null>(null);

  const redirectTarget = redirectTo ?? loginPath;
  const shouldPoll = useMemo(() => Boolean(revalidateIntervalMs && revalidateIntervalMs > 0), [revalidateIntervalMs]);
  const shouldRevalidateOnFocus = useMemo(() => Boolean(revalidateOnFocus), [revalidateOnFocus]);
  const effectiveCheckAuth = useMemo(() => checkAuth ?? createDefaultCheckAuth(client), [checkAuth, client]);

  useEffect(() => {
    let isMounted = true;
    let isChecking = false;
    let intervalId: number | undefined;

    const runCheck = async (): Promise<void> => {
      if (isChecking) {
        return;
      }

      isChecking = true;
      let authorized = false;
      let fetchedRole: UserRole | null = null;

      try {
        const result = await effectiveCheckAuth();

        if (typeof result === "boolean") {
          authorized = result;
        } else {
          ({ authorized, role: fetchedRole } = result);
        }
      } catch {
        authorized = false;
      } finally {
        isChecking = false;
      }

      if (!isMounted) {
        return;
      }

      if (authorized) {
        setRole(fetchedRole);
        setStatus("allowed");

        if (intervalId !== undefined) {
          window.clearInterval(intervalId);
          intervalId = undefined;
        }

        return;
      }

      setStatus("unauthorized");
    };

    let lastRevalidation = 0;

    const debouncedCheck = (): void => {
      const now = Date.now();

      if (now - lastRevalidation < REVALIDATION_COOLDOWN_MS) {
        return;
      }

      lastRevalidation = now;
      void runCheck();
    };

    const handleFocus = (): void => {
      debouncedCheck();
    };

    const handleVisibility = (): void => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        debouncedCheck();
      }
    };

    void runCheck();

    if (shouldPoll) {
      intervalId = window.setInterval(() => {
        void runCheck();
      }, revalidateIntervalMs);
    }

    if (shouldRevalidateOnFocus && typeof window !== "undefined") {
      window.addEventListener("focus", handleFocus);

      if (typeof document !== "undefined") {
        document.addEventListener("visibilitychange", handleVisibility);
      }
    }

    return () => {
      isMounted = false;

      if (intervalId !== undefined) {
        window.clearInterval(intervalId);
      }

      if (shouldRevalidateOnFocus && typeof window !== "undefined") {
        window.removeEventListener("focus", handleFocus);

        if (typeof document !== "undefined") {
          document.removeEventListener("visibilitychange", handleVisibility);
        }
      }
    };
  }, [effectiveCheckAuth, revalidateIntervalMs, shouldPoll, shouldRevalidateOnFocus]);

  if (status === "allowed") {
    return <AuthProvider role={role}>{children}</AuthProvider>;
  }

  if (status === "unauthorized") {
    if (redirectTarget) {
      const isCrossOrigin = redirectTarget.startsWith("http://") || redirectTarget.startsWith("https://");

      if (isCrossOrigin) {
        if (typeof window !== "undefined") {
          window.location.replace(redirectTarget);
        }

        return null;
      }

      return <Navigate to={redirectTarget} replace />;
    }

    if (fallback !== null) {
      return <>{fallback}</>;
    }

    return null;
  }

  return null;
};
