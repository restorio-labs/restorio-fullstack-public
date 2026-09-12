export interface CheckAuthSessionOptions {
  requireSessionHintCookie?: string;
  documentRef?: Document;
}

export type PublicWebAuthKind = "authenticated" | "anonymous" | "unavailable";

export interface CheckPublicWebAuthOptions extends CheckAuthSessionOptions {
  isBackendReachable: () => Promise<boolean>;
  onReconnecting?: () => void;
}

const HEALTH_RAMP_DELAYS_MS = [2000, 4000, 8000] as const;
const HEALTH_CAP_DELAY_MS = 8000;
const HEALTH_CAP_REPEAT_COUNT = 5;

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

export const checkBackendReachableWithRetries = async (
  ping: () => Promise<boolean>,
  onFirstFailure: () => void,
): Promise<boolean> => {
  if (await ping()) {
    return true;
  }

  onFirstFailure();

  for (const delay of HEALTH_RAMP_DELAYS_MS) {
    await sleep(delay);

    if (await ping()) {
      return true;
    }
  }

  for (let i = 0; i < HEALTH_CAP_REPEAT_COUNT; i += 1) {
    await sleep(HEALTH_CAP_DELAY_MS);

    if (await ping()) {
      return true;
    }
  }

  return false;
};

const hasCookie = (cookieName: string, documentRef?: Document): boolean => {
  if (typeof document === "undefined" && documentRef === undefined) {
    return false;
  }

  const doc = documentRef ?? document;

  return doc.cookie.split(";").some((entry) => entry.trim().startsWith(`${cookieName}=`));
};

export const checkAuthSession = async (
  getCurrentSession: () => Promise<unknown>,
  options?: CheckAuthSessionOptions,
): Promise<boolean> => {
  if (options?.requireSessionHintCookie && !hasCookie(options.requireSessionHintCookie, options.documentRef)) {
    return false;
  }

  try {
    await getCurrentSession();

    return true;
  } catch {
    return false;
  }
};

export const checkPublicWebAuth = async (
  getCurrentSession: () => Promise<unknown>,
  options: CheckPublicWebAuthOptions,
): Promise<PublicWebAuthKind> => {
  if (options.requireSessionHintCookie && !hasCookie(options.requireSessionHintCookie, options.documentRef)) {
    return "anonymous";
  }

  try {
    await getCurrentSession();

    return "authenticated";
  } catch {
    const reachable = await checkBackendReachableWithRetries(options.isBackendReachable, () => {
      options.onReconnecting?.();
    });

    if (!reachable) {
      return "unavailable";
    }

    return "anonymous";
  }
};
