import type { ReactElement, ReactNode } from "react";
import { createContext, useContext } from "react";

import type { UserRole } from "./RoleGuard";

export interface AuthContextValue {
  role: UserRole | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export interface AuthProviderProps {
  children: ReactNode;
  role: UserRole | null;
}

export const AuthProvider = ({ children, role }: AuthProviderProps): ReactElement => {
  return <AuthContext.Provider value={{ role }}>{children}</AuthContext.Provider>;
};

export const useAuthContext = (): AuthContextValue => {
  const context = useContext(AuthContext);

  if (context === null) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }

  return context;
};
