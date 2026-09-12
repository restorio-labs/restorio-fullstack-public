import { describe, expect, it, vi, afterEach } from "vitest";

interface StorageKeys {
  THEME_STORAGE_KEY: string;
  LAST_VISITED_APP_STORAGE_KEY: string;
  ACCESS_TOKEN_KEY: string;
  REFRESH_TOKEN_KEY: string;
  SESSION_HINT_COOKIE: string;
  CROSS_APP_BACKUP_STORAGE_KEY: string;
}

const loadStorageKeys = async (): Promise<StorageKeys> => {
  const {
    THEME_STORAGE_KEY,
    LAST_VISITED_APP_STORAGE_KEY,
    ACCESS_TOKEN_KEY,
    REFRESH_TOKEN_KEY,
    SESSION_HINT_COOKIE,
    CROSS_APP_BACKUP_STORAGE_KEY,
  } = await import("../../src/storageKeys");

  return {
    THEME_STORAGE_KEY,
    LAST_VISITED_APP_STORAGE_KEY,
    ACCESS_TOKEN_KEY,
    REFRESH_TOKEN_KEY,
    SESSION_HINT_COOKIE,
    CROSS_APP_BACKUP_STORAGE_KEY,
  };
};

describe("storageKeys", () => {
  afterEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it("falls back to default keys when no environment overrides are present", async () => {
    delete process.env.THEME_STORAGE_KEY;
    delete process.env.LAST_VISITED_APP_STORAGE_KEY;
    delete process.env.ACCESS_TOKEN_KEY;
    delete process.env.REFRESH_TOKEN_KEY;
    delete process.env.SESSION_HINT_COOKIE;
    delete process.env.CROSS_APP_BACKUP_STORAGE_KEY;

    const keys = await loadStorageKeys();

    expect(keys.THEME_STORAGE_KEY).toBe("rtm");
    expect(keys.LAST_VISITED_APP_STORAGE_KEY).toBe("rlvp");
    expect(keys.ACCESS_TOKEN_KEY).toBe("rat");
    expect(keys.REFRESH_TOKEN_KEY).toBe("rrt");
    expect(keys.SESSION_HINT_COOKIE).toBe("rshc");
    expect(keys.CROSS_APP_BACKUP_STORAGE_KEY).toBe("rsinfo");
  });

  it("prefers environment overrides when they are set", async () => {
    vi.stubEnv("THEME_STORAGE_KEY", "custom-theme");
    vi.stubEnv("LAST_VISITED_APP_STORAGE_KEY", "custom-last-visited");
    vi.stubEnv("ACCESS_TOKEN_KEY", "custom-access");
    vi.stubEnv("REFRESH_TOKEN_KEY", "custom-refresh");
    vi.stubEnv("SESSION_HINT_COOKIE", "custom-session-hint");
    vi.stubEnv("CROSS_APP_BACKUP_STORAGE_KEY", "custom-backup");

    const keys = await loadStorageKeys();

    expect(keys.THEME_STORAGE_KEY).toBe("custom-theme");
    expect(keys.LAST_VISITED_APP_STORAGE_KEY).toBe("custom-last-visited");
    expect(keys.ACCESS_TOKEN_KEY).toBe("custom-access");
    expect(keys.REFRESH_TOKEN_KEY).toBe("custom-refresh");
    expect(keys.SESSION_HINT_COOKIE).toBe("custom-session-hint");
    expect(keys.CROSS_APP_BACKUP_STORAGE_KEY).toBe("custom-backup");
  });
});
