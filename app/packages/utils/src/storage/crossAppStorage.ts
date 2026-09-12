import { CROSS_APP_BACKUP_STORAGE_KEY } from "../storageKeys";

const getDocument = (): Document | undefined => {
  if (typeof document === "undefined") {
    return undefined;
  }

  return document;
};

const readLegacyStorageValue = (key: string): string | null => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

const getLongLivedExpiryDate = (): Date => {
  const expiry = new Date();

  expiry.setFullYear(expiry.getFullYear() + 100);

  return expiry;
};

const getCookieValue = (key: string): string | null => {
  const doc = getDocument();

  if (!doc) {
    return null;
  }

  const cookieEntry = doc.cookie
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${key}=`));

  if (!cookieEntry) {
    return null;
  }

  return decodeURIComponent(cookieEntry.slice(key.length + 1));
};

const setCookieValue = (key: string, value: string, expires: Date): void => {
  const doc = getDocument();

  if (!doc) {
    return;
  }

  doc.cookie = `${key}=${encodeURIComponent(value)}; expires=${expires.toUTCString()}; path=/; samesite=lax`;
};

const readBackupStorage = (): Record<string, string> => {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const stored = window.localStorage.getItem(CROSS_APP_BACKUP_STORAGE_KEY);

    if (!stored) {
      return {};
    }

    const parsed: unknown = JSON.parse(stored);

    if (typeof parsed !== "object" || parsed === null) {
      return {};
    }

    return Object.entries(parsed).reduce<Record<string, string>>((acc, [key, value]) => {
      if (typeof value === "string") {
        acc[key] = value;
      }

      return acc;
    }, {});
  } catch {
    return {};
  }
};

const writeBackupStorage = (value: Record<string, string>): void => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(CROSS_APP_BACKUP_STORAGE_KEY, JSON.stringify(value));
  } catch {
    // Ignore storage errors in unsupported environments
  }
};

const updateBackupStorage = (key: string, value: string): void => {
  const backup = readBackupStorage();

  backup[key] = value;

  writeBackupStorage(backup);
};

export const setCrossAppValue = (key: string, value: string): void => {
  const expiry = getLongLivedExpiryDate();

  setCookieValue(key, value, expiry);
  updateBackupStorage(key, value);
};

export const getCrossAppValue = (key: string): string | null => {
  const cookieValue = getCookieValue(key);

  if (cookieValue) {
    updateBackupStorage(key, cookieValue);

    return cookieValue;
  }

  const backup = readBackupStorage();
  const backupValue = backup[key];

  if (typeof backupValue === "string" && backupValue.trim() !== "") {
    setCrossAppValue(key, backupValue);

    return backupValue;
  }

  const legacyValue = readLegacyStorageValue(key);

  if (typeof legacyValue === "string" && legacyValue.trim() !== "") {
    setCrossAppValue(key, legacyValue);

    return legacyValue;
  }

  return null;
};
