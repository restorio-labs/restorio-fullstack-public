import { Text, useI18n } from "@restorio/ui";
import type { ReactElement, ReactNode } from "react";
import { useEffect, useState } from "react";

import { isMobileOrTabletClient } from "../lib/mobileDevice";

interface MobileDeviceGateProps {
  children: ReactNode;
}

export const MobileDeviceGate = ({ children }: MobileDeviceGateProps): ReactElement => {
  const { t } = useI18n();
  const [allowed, setAllowed] = useState(() => isMobileOrTabletClient());

  useEffect(() => {
    setAllowed(isMobileOrTabletClient());
  }, []);

  if (!allowed) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background-primary p-6 text-center">
        <Text as="h1" variant="h4" weight="bold" className="mb-2">
          {t("deviceGate.title")}
        </Text>
        <Text as="p" variant="body-md" className="max-w-sm text-text-secondary">
          {t("deviceGate.description")}
        </Text>
      </div>
    );
  }

  return <>{children}</>;
};
