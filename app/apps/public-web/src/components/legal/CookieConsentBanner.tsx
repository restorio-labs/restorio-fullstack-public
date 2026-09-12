"use client";

import { Button, Card, Modal, Stack, Switch, Text } from "@restorio/ui";
import Link from "next/link";
import { useEffect, useState, type ReactElement } from "react";

import { useLocale, useTranslations } from "@/i18n/useT";

interface CookiePreferences {
  necessary: boolean;
  functional: boolean;
  analytical: boolean;
  marketing: boolean;
}

const COOKIE_CONSENT_KEY = "cookie-consent";

const CookieConsentBanner = (): ReactElement | null => {
  const t = useTranslations("legal.cookieConsent");
  const locale = useLocale();
  const [isVisible, setIsVisible] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true,
    functional: false,
    analytical: false,
    marketing: false,
  });

  useEffect(() => {
    const consent = typeof window !== "undefined" ? window.localStorage.getItem(COOKIE_CONSENT_KEY) : null;

    if (!consent) {
      setIsVisible(true);

      return;
    }

    try {
      const parsed = JSON.parse(consent) as CookiePreferences;

      setPreferences(parsed);
    } catch {
      setIsVisible(true);
    }
  }, []);

  const saveConsent = (prefs: CookiePreferences): void => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(prefs));
    }
    setIsVisible(false);
  };

  const acceptAll = (): void => {
    const allAccepted: CookiePreferences = {
      necessary: true,
      functional: true,
      analytical: true,
      marketing: true,
    };

    saveConsent(allAccepted);
  };

  const acceptNecessary = (): void => {
    const necessaryOnly: CookiePreferences = {
      necessary: true,
      functional: false,
      analytical: false,
      marketing: false,
    };

    saveConsent(necessaryOnly);
  };

  return (
    <Modal
      isOpen={isVisible}
      onClose={acceptNecessary}
      title={t("banner.title")}
      size="lg"
      closeOnOverlayClick={false}
      variant="cookie"
      closeButtonAriaLabel="Zamknij baner cookies"
    >
      <Card className="shadow-none border-0 p-0">
        <div className="flex flex-col gap-4">
          <Stack spacing="sm">
            <Text as="h3" variant="h4" weight="semibold">
              {t("banner.title")}
            </Text>
            <Text variant="body-sm" className="text-text-secondary">
              {t("banner.description")}
            </Text>

            {showCustomize && (
              <div className="mt-2 rounded-lg bg-surface-secondary/70 p-4">
                <Stack spacing="sm">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <Text variant="body-sm" weight="medium">
                        {t("categories.necessary")}
                      </Text>
                      <Text variant="caption" className="text-text-secondary">
                        Zawsze aktywne
                      </Text>
                    </div>
                    <Switch checked disabled />
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <Text variant="body-sm" weight="medium">
                      {t("categories.functional")}
                    </Text>
                    <Switch
                      checked={preferences.functional}
                      onChange={(event): void =>
                        setPreferences((prev) => ({ ...prev, functional: event.target.checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <Text variant="body-sm" weight="medium">
                      {t("categories.analytical")}
                    </Text>
                    <Switch
                      checked={preferences.analytical}
                      onChange={(event): void =>
                        setPreferences((prev) => ({ ...prev, analytical: event.target.checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <Text variant="body-sm" weight="medium">
                      {t("categories.marketing")}
                    </Text>
                    <Switch
                      checked={preferences.marketing}
                      onChange={(event): void =>
                        setPreferences((prev) => ({ ...prev, marketing: event.target.checked }))
                      }
                    />
                  </div>
                </Stack>
              </div>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Button size="sm" onClick={acceptAll}>
                {t("banner.acceptAll")}
              </Button>
              <Button size="sm" variant="secondary" onClick={acceptNecessary}>
                {t("banner.acceptNecessary")}
              </Button>
              {!showCustomize ? (
                <Button size="sm" variant="secondary" onClick={(): void => setShowCustomize(true)}>
                  {t("banner.customize")}
                </Button>
              ) : (
                <Button size="sm" variant="secondary" onClick={(): void => saveConsent(preferences)}>
                  {t("banner.savePreferences")}
                </Button>
              )}
              <Link
                href={`/${locale}/terms`}
                className="ml-2 text-sm text-text-secondary underline-offset-2 hover:underline"
              >
                {t("banner.privacyPolicy")}
              </Link>
            </div>
          </Stack>
        </div>
      </Card>
    </Modal>
  );
};

export default CookieConsentBanner;
