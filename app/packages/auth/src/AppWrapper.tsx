import type { ReactElement, ReactNode } from "react";

import { AUTH_LOGIN_REDIRECT_URL, AUTH_REVALIDATE_INTERVAL_MS } from "./authConfig";
import { AuthGuard, type AuthGuardProps } from "./guard";

export interface AppWrapperProps {
  children: ReactNode;
  client: AuthGuardProps["client"];
  redirectTo?: string;
  revalidateIntervalMs?: number;
  fallback?: ReactNode;
}

export const AppWrapper = ({
  children,
  client,
  redirectTo = AUTH_LOGIN_REDIRECT_URL,
  revalidateIntervalMs = AUTH_REVALIDATE_INTERVAL_MS,
  fallback,
}: AppWrapperProps): ReactElement => {
  return (
    <AuthGuard redirectTo={redirectTo} client={client} revalidateIntervalMs={revalidateIntervalMs} fallback={fallback}>
      {children}
    </AuthGuard>
  );
};
