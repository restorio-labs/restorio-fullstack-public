"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { ReactElement, ReactNode } from "react";

export type AuthRouteStatus = "loading" | "reconnecting" | "authenticated" | "anonymous" | "unavailable";

interface AuthRouteContextValue {
  authStatus: AuthRouteStatus;
  refreshAuth: () => Promise<void>;
}

const AuthRouteContext = createContext<AuthRouteContextValue | null>(null);

export type AuthRouteResolvedStatus = Exclude<AuthRouteStatus, "loading" | "reconnecting">;

export interface AuthCheckContext {
  onReconnecting: () => void;
}

export interface AuthRouteProviderProps {
  children: ReactNode;
  checkAuth: (ctx: AuthCheckContext) => Promise<AuthRouteResolvedStatus>;
}

export const AuthRouteProvider = ({ children, checkAuth }: AuthRouteProviderProps): ReactElement => {
  const [authStatus, setAuthStatus] = useState<AuthRouteStatus>("loading");
  const isMountedRef = useRef(false);

  const runAuthCheck = useCallback(async (): Promise<void> => {
    const resolved = await checkAuth({
      onReconnecting: () => {
        if (isMountedRef.current) {
          setAuthStatus("reconnecting");
        }
      },
    });

    if (isMountedRef.current) {
      setAuthStatus(resolved);
    }
  }, [checkAuth]);

  useEffect(() => {
    isMountedRef.current = true;
    void runAuthCheck();

    return () => {
      isMountedRef.current = false;
    };
  }, [runAuthCheck]);

  const refreshAuth = useCallback(async (): Promise<void> => {
    await runAuthCheck();
  }, [runAuthCheck]);

  const value: AuthRouteContextValue = { authStatus, refreshAuth };

  return <AuthRouteContext.Provider value={value}>{children}</AuthRouteContext.Provider>;
};

export const useAuthRoute = (): AuthRouteContextValue => {
  const ctx = useContext(AuthRouteContext);

  if (ctx === null) {
    throw new Error("useAuthRoute must be used within AuthRouteProvider");
  }

  return ctx;
};
