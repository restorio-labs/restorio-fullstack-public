import { Loader } from "@restorio/ui";
import { useQuery } from "@tanstack/react-query";
import type { ReactElement } from "react";
import { useEffect, useRef } from "react";
import { Navigate, Outlet, useParams } from "react-router-dom";

import { api } from "../api/client";
import { buildInvalidKitchenTenantRedirectUrl } from "../utils/invalidTenantRedirect";

const getErrorStatus = (err: unknown): number | undefined => {
  if (typeof err === "object" && err !== null && "response" in err) {
    const { response } = err as { response?: { status?: number } };

    return response?.status;
  }

  return undefined;
};

export const TenantRouteGuard = (): ReactElement => {
  const { tenantId } = useParams<{ tenantId: string }>();
  const redirectStarted = useRef(false);

  useEffect(() => {
    redirectStarted.current = false;
  }, [tenantId]);

  const query = useQuery({
    queryKey: ["kitchen-tenant-access", tenantId],
    queryFn: () => api.tenants.get(tenantId ?? ""),
    retry: false,
    enabled: typeof tenantId === "string" && tenantId.trim() !== "",
  });

  useEffect(() => {
    if (query.isLoading || !query.isError || redirectStarted.current) {
      return;
    }

    const status = getErrorStatus(query.error);

    if (status !== 403) {
      return;
    }

    redirectStarted.current = true;
    window.location.href = buildInvalidKitchenTenantRedirectUrl();
  }, [query.isError, query.error, query.isLoading]);

  if (typeof tenantId !== "string" || tenantId.trim() === "") {
    return <Navigate to="/" replace />;
  }

  if (query.isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (query.isError) {
    const status = getErrorStatus(query.error);

    if (status === 404) {
      return <Navigate to="/" replace />;
    }

    if (status === 403) {
      return <div />;
    }

    return <div />;
  }

  return <Outlet />;
};
