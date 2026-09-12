import type { ReactElement, ReactNode } from "react";
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

import { AUTH_LOGIN_REDIRECT_URL } from "./authConfig";
import { useAuthContext } from "./AuthContext";

export type UserRole = "super_admin" | "admin" | "owner" | "manager" | "waiter" | "kitchen";

export interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: UserRole[];
  redirectTo?: string;
  fallback?: ReactNode;
}

export const useCurrentRole = (): UserRole | null => {
  const { role } = useAuthContext();

  return role;
};

const CrossOriginRedirect = ({ url }: { url: string }): null => {
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (!redirecting && typeof window !== "undefined") {
      setRedirecting(true);
      window.location.replace(url);
    }
  }, [url, redirecting]);

  return null;
};

export const RoleGuard = ({
  children,
  allowedRoles,
  redirectTo = AUTH_LOGIN_REDIRECT_URL,
  fallback = null,
}: RoleGuardProps): ReactElement | null => {
  const currentRole = useCurrentRole();

  const handleRedirect = (): ReactElement | null => {
    if (fallback !== null) {
      return <>{fallback}</>;
    }

    const isCrossOrigin = redirectTo.startsWith("http://") || redirectTo.startsWith("https://");

    if (isCrossOrigin) {
      return <CrossOriginRedirect url={redirectTo} />;
    }

    return <Navigate to={redirectTo} replace />;
  };

  if (!currentRole) {
    return handleRedirect();
  }

  if (!allowedRoles.includes(currentRole)) {
    return handleRedirect();
  }

  return <>{children}</>;
};
