import {
  Button,
  cn,
  Dropdown,
  FormActions,
  Loader,
  mergeColorOverrideSlices,
  MobileGuestAppPreview,
  Tooltip,
  useI18n,
  useToast,
  type MobileGuestPreviewScreen,
  type ThemeColorOverrideSlice,
  type ThemeOverride,
} from "@restorio/ui";
import { resolveApiBaseUrl } from "@restorio/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ChangeEvent, FormEvent, ReactElement } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { TbChevronDown, TbHelpCircle } from "react-icons/tb";

import { api } from "../api/client";
import { FilePickerField } from "../components/file-picker";
import { useCurrentTenant } from "../context/TenantContext";
import { PageLayout } from "../layouts/PageLayout";

const mobileConfigQueryKey = (tenantId: string): readonly string[] => ["tenant-mobile-config", tenantId];

const ICO_TYPES = new Set(["image/x-icon", "image/vnd.microsoft.icon"]);

const PICKER_FALLBACK_PRIMARY_BG = "#0059cb";
const PICKER_FALLBACK_PRIMARY_TEXT = "#ffffff";
const PICKER_FALLBACK_SECONDARY_BG = "#51555c";
const PICKER_FALLBACK_SECONDARY_TEXT = "#0a0e14";
const PICKER_FALLBACK_DARK_BG = "#0a0e14";
const PICKER_FALLBACK_DARK_PRIMARY_BG = "#89acff";
const PICKER_FALLBACK_DARK_PRIMARY_TEXT = "#002b6a";
const PICKER_FALLBACK_DARK_SECONDARY_BG = "#a8abb3";
const PICKER_FALLBACK_DARK_SECONDARY_TEXT = "#f1f3fc";
const PICKER_FALLBACK_TEXT_PRIMARY = "#0a0e14";
const PICKER_FALLBACK_TEXT_SECONDARY = "#51555c";
const PICKER_FALLBACK_TEXT_TERTIARY = "#72757d";
const PICKER_FALLBACK_BORDER = "#e9ecef";
const PICKER_FALLBACK_SURFACE_PRIMARY = "#ffffff";
const PICKER_FALLBACK_SURFACE_SECONDARY = "#f8f9fa";
const PICKER_FALLBACK_DARK_TEXT_PRIMARY = "#f1f3fc";
const PICKER_FALLBACK_DARK_TEXT_SECONDARY = "#a8abb3";
const PICKER_FALLBACK_DARK_TEXT_TERTIARY = "#72757d";
const PICKER_FALLBACK_DARK_BORDER = "#44484f";
const PICKER_FALLBACK_DARK_SURFACE_PRIMARY = "#151a21";
const PICKER_FALLBACK_DARK_SURFACE_SECONDARY = "#1b2028";
const PICKER_FALLBACK_PROMOTED_BG = "#fbbf24";
const PICKER_FALLBACK_PROMOTED_TEXT = "#422006";
const PICKER_FALLBACK_PROMOTED_BORDER = "#d97706";
const PICKER_FALLBACK_DARK_PROMOTED_BG = "#b45309";
const PICKER_FALLBACK_DARK_PROMOTED_TEXT = "#fffbeb";
const PICKER_FALLBACK_DARK_PROMOTED_BORDER = "#fbbf24";

interface MobileModeThemeFields {
  backgroundColor: string;
  primaryButtonBg: string;
  primaryButtonText: string;
  secondaryButtonBg: string;
  secondaryButtonText: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  borderDefault: string;
  surfacePrimary: string;
  surfaceSecondary: string;
  promotedBadgeBackground: string;
  promotedBadgeText: string;
  promotedBadgeBorder: string;
}

const emptyMobileModeTheme = (): MobileModeThemeFields => ({
  backgroundColor: "",
  primaryButtonBg: "",
  primaryButtonText: "",
  secondaryButtonBg: "",
  secondaryButtonText: "",
  textPrimary: "",
  textSecondary: "",
  textTertiary: "",
  borderDefault: "",
  surfacePrimary: "",
  surfaceSecondary: "",
  promotedBadgeBackground: "",
  promotedBadgeText: "",
  promotedBadgeBorder: "",
});

const sliceToMobileModeTheme = (slice: ThemeColorOverrideSlice | undefined): MobileModeThemeFields => {
  if (!slice) {
    return emptyMobileModeTheme();
  }

  const interactive = slice.interactive as Record<string, string> | undefined;
  const text = slice.text as Record<string, string> | undefined;
  const border = slice.border as Record<string, string> | undefined;
  const surface = slice.surface as Record<string, string> | undefined;
  const promoted = slice.status?.promoted as Record<string, string> | undefined;

  return {
    backgroundColor: slice.background?.primary ?? "",
    primaryButtonBg: interactive?.primary ?? "",
    primaryButtonText: interactive?.primaryForeground ?? "",
    secondaryButtonBg: interactive?.secondary ?? "",
    secondaryButtonText: interactive?.secondaryForeground ?? "",
    textPrimary: text?.primary ?? "",
    textSecondary: text?.secondary ?? "",
    textTertiary: text?.tertiary ?? "",
    borderDefault: border?.default ?? "",
    surfacePrimary: surface?.primary ?? "",
    surfaceSecondary: surface?.secondary ?? "",
    promotedBadgeBackground: promoted?.background ?? "",
    promotedBadgeText: promoted?.text ?? "",
    promotedBadgeBorder: promoted?.border ?? "",
  };
};

type BuiltMobileColorSlice = Record<string, Record<string, string> | Record<string, Record<string, string>>>;

const buildColorSliceFromMobileMode = (m: MobileModeThemeFields): BuiltMobileColorSlice | null => {
  const trimmedBg = m.backgroundColor.trim();
  const interactive: Record<string, string> = {};
  const pb = m.primaryButtonBg.trim();
  const pt = m.primaryButtonText.trim();
  const sb = m.secondaryButtonBg.trim();
  const st = m.secondaryButtonText.trim();

  if (pb) {
    interactive.primary = pb;
  }

  if (pt) {
    interactive.primaryForeground = pt;
  }

  if (sb) {
    interactive.secondary = sb;
  }

  if (st) {
    interactive.secondaryForeground = st;
  }

  const text: Record<string, string> = {};
  const tp = m.textPrimary.trim();
  const ts = m.textSecondary.trim();
  const tt = m.textTertiary.trim();

  if (tp) {
    text.primary = tp;
  }

  if (ts) {
    text.secondary = ts;
  }

  if (tt) {
    text.tertiary = tt;
  }

  const border: Record<string, string> = {};
  const bd = m.borderDefault.trim();

  if (bd) {
    border.default = bd;
  }

  const surface: Record<string, string> = {};
  const sp = m.surfacePrimary.trim();
  const ss = m.surfaceSecondary.trim();

  if (sp) {
    surface.primary = sp;
  }

  if (ss) {
    surface.secondary = ss;
  }

  const colors: BuiltMobileColorSlice = {};

  if (trimmedBg) {
    colors.background = { primary: trimmedBg };
  }

  if (Object.keys(interactive).length > 0) {
    colors.interactive = interactive;
  }

  if (Object.keys(text).length > 0) {
    colors.text = text;
  }

  if (Object.keys(border).length > 0) {
    colors.border = border;
  }

  if (Object.keys(surface).length > 0) {
    colors.surface = surface;
  }

  const promoted: Record<string, string> = {};
  const prBg = m.promotedBadgeBackground.trim();
  const prTx = m.promotedBadgeText.trim();
  const prBd = m.promotedBadgeBorder.trim();

  if (prBg) {
    promoted.background = prBg;
  }

  if (prTx) {
    promoted.text = prTx;
  }

  if (prBd) {
    promoted.border = prBd;
  }

  if (Object.keys(promoted).length > 0) {
    colors.status = { promoted };
  }

  if (Object.keys(colors).length === 0) {
    return null;
  }

  return colors;
};

const buildMobileThemeOverride = (
  themeLight: MobileModeThemeFields,
  themeDark: MobileModeThemeFields,
  googleFontUrl: string,
): Record<string, unknown> | null => {
  const trimmedFont = googleFontUrl.trim();
  const lightSlice = buildColorSliceFromMobileMode(themeLight);
  const darkSlice = buildColorSliceFromMobileMode(themeDark);
  const typography = trimmedFont ? { fontFamily: { googleFontUrl: trimmedFont } } : undefined;

  if (!lightSlice && !darkSlice && !typography) {
    return null;
  }

  const out: Record<string, unknown> = {};

  if (lightSlice) {
    out.colorsLight = lightSlice;
  }

  if (darkSlice) {
    out.colorsDark = darkSlice;
  }

  if (typography) {
    out.typography = typography;
  }

  return out;
};

const readThemeOverrideIntoModeFields = (
  override: unknown,
): {
  light: MobileModeThemeFields;
  dark: MobileModeThemeFields;
} => {
  if (!override || typeof override !== "object" || Array.isArray(override)) {
    return { light: emptyMobileModeTheme(), dark: emptyMobileModeTheme() };
  }

  const o = override as Record<string, unknown>;
  const legacy = o.colors as ThemeColorOverrideSlice | undefined;
  const colorsLight = o.colorsLight as ThemeColorOverrideSlice | undefined;
  const colorsDark = o.colorsDark as ThemeColorOverrideSlice | undefined;

  const lightMerged = mergeColorOverrideSlices(legacy, colorsLight);
  const darkMerged = mergeColorOverrideSlices(legacy, colorsDark);

  return {
    light: sliceToMobileModeTheme(lightMerged),
    dark: sliceToMobileModeTheme(darkMerged),
  };
};

interface ThemeColorFieldProps {
  id: string;
  label: string;
  hint?: string;
  value: string;
  onChange: (next: string) => void;
  pickerFallback: string;
  clearLabel: string;
}

const ThemeColorField = ({
  id,
  label,
  hint,
  value,
  onChange,
  pickerFallback,
  clearLabel,
}: ThemeColorFieldProps): ReactElement => (
  <div>
    <label className="mb-1 block text-xs font-medium text-text-secondary" htmlFor={id}>
      {label}
    </label>
    <div className="flex items-center gap-2">
      <input
        id={id}
        type="color"
        value={value || pickerFallback}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-14 cursor-pointer rounded-sm border border-border-default bg-surface-primary p-1"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={pickerFallback}
        className="flex-1 rounded-md border border-border-default bg-surface-primary px-3 py-2 text-sm text-text-primary font-mono"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          className="text-xs text-text-tertiary hover:text-text-secondary"
        >
          {clearLabel}
        </button>
      ) : null}
    </div>
    {hint ? <p className="mt-1 text-xs text-text-tertiary">{hint}</p> : null}
  </div>
);

export const MobileConfigurationPage = (): ReactElement => {
  const { t } = useI18n();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const { selectedTenantId, selectedTenant, tenants } = useCurrentTenant();

  const [pageTitle, setPageTitle] = useState("");
  const [themeLight, setThemeLight] = useState<MobileModeThemeFields>(emptyMobileModeTheme);
  const [themeDark, setThemeDark] = useState<MobileModeThemeFields>(emptyMobileModeTheme);
  const [themePersonalizationMode, setThemePersonalizationMode] = useState<"light" | "dark">("light");
  const [googleFontUrl, setGoogleFontUrl] = useState("");
  const [fontError, setFontError] = useState("");
  const [faviconError, setFaviconError] = useState("");
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [copySourceId, setCopySourceId] = useState("");
  const [landingHeadline, setLandingHeadline] = useState("");
  const [landingSubtitle, setLandingSubtitle] = useState("");
  const [landingTablesCta, setLandingTablesCta] = useState("");
  const [landingMenuCta, setLandingMenuCta] = useState("");
  const [landingOpenLabel, setLandingOpenLabel] = useState("");
  const [landingClosedLabel, setLandingClosedLabel] = useState("");
  const [landingUiLocale, setLandingUiLocale] = useState("");
  const [faviconPreviewNonce, setFaviconPreviewNonce] = useState(0);
  const [faviconObjectUrl, setFaviconObjectUrl] = useState<string | null>(null);
  const [previewScreen, setPreviewScreen] = useState<MobileGuestPreviewScreen>("landing");

  const activeMobileTheme = themePersonalizationMode === "light" ? themeLight : themeDark;

  const patchActiveMobileTheme = (patch: Partial<MobileModeThemeFields>): void => {
    if (themePersonalizationMode === "light") {
      setThemeLight((prev) => ({ ...prev, ...patch }));
    } else {
      setThemeDark((prev) => ({ ...prev, ...patch }));
    }
  };

  const tenantId = selectedTenantId;

  const { data: config, isLoading } = useQuery({
    queryKey: mobileConfigQueryKey(tenantId ?? ""),
    queryFn: () => api.tenantMobileConfig.get(tenantId!),
    enabled: tenantId !== null,
  });

  useEffect(() => {
    if (!faviconFile) {
      setFaviconObjectUrl(null);

      return;
    }

    const url = URL.createObjectURL(faviconFile);

    setFaviconObjectUrl(url);

    return (): void => {
      URL.revokeObjectURL(url);
    };
  }, [faviconFile]);

  useEffect(() => {
    if (!config) {
      setPageTitle("");
      setThemeLight(emptyMobileModeTheme());
      setThemeDark(emptyMobileModeTheme());
      setThemePersonalizationMode("light");
      setGoogleFontUrl("");
      setFontError("");
      setLandingHeadline("");
      setLandingSubtitle("");
      setLandingTablesCta("");
      setLandingMenuCta("");
      setLandingOpenLabel("");
      setLandingClosedLabel("");
      setLandingUiLocale("");

      return;
    }

    setPageTitle(config.pageTitle ?? "");

    const lc = config.landingContent;

    if (lc && typeof lc === "object") {
      setLandingHeadline(typeof lc.headline === "string" ? lc.headline : "");
      setLandingSubtitle(typeof lc.subtitle === "string" ? lc.subtitle : "");
      setLandingTablesCta(typeof lc.tablesCtaLabel === "string" ? lc.tablesCtaLabel : "");
      setLandingMenuCta(typeof lc.menuCtaLabel === "string" ? lc.menuCtaLabel : "");
      setLandingOpenLabel(typeof lc.openStatusLabel === "string" ? lc.openStatusLabel : "");
      setLandingClosedLabel(typeof lc.closedStatusLabel === "string" ? lc.closedStatusLabel : "");
      setLandingUiLocale(typeof lc.uiLocale === "string" ? lc.uiLocale : "");
    } else {
      setLandingHeadline("");
      setLandingSubtitle("");
      setLandingTablesCta("");
      setLandingMenuCta("");
      setLandingOpenLabel("");
      setLandingClosedLabel("");
      setLandingUiLocale("");
    }

    const { light, dark } = readThemeOverrideIntoModeFields(config.themeOverride);

    setThemeLight(light);
    setThemeDark(dark);
    setThemePersonalizationMode("light");

    const override = config.themeOverride;

    if (override && typeof override === "object") {
      const typography = override.typography as Record<string, Record<string, string>> | undefined;

      setGoogleFontUrl(typography?.fontFamily?.googleFontUrl ?? "");
    } else {
      setGoogleFontUrl("");
    }

    setFontError("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config]);

  const otherTenants = useMemo(() => {
    if (!tenantId || tenants.length === 0) {
      return [];
    }

    return tenants.filter((x) => x.id !== tenantId);
  }, [tenantId, tenants]);

  const validateGoogleFontUrl = (url: string): boolean => {
    if (!url.trim()) {
      return true;
    }

    const pattern = /^https:\/\/fonts\.googleapis\.com\/css2?\?family=/;

    return pattern.test(url.trim());
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!tenantId) {
        throw new Error("No tenant");
      }

      const trimmedFont = googleFontUrl.trim();

      if (trimmedFont && !validateGoogleFontUrl(trimmedFont)) {
        setFontError(t("mobileConfiguration.errors.invalidGoogleFontUrl"));

        throw new Error("font");
      }

      setFontError("");

      const themeOverride = buildMobileThemeOverride(themeLight, themeDark, trimmedFont);

      const landingContentPayload = {
        headline: landingHeadline.trim() || null,
        subtitle: landingSubtitle.trim() || null,
        tablesCtaLabel: landingTablesCta.trim() || null,
        menuCtaLabel: landingMenuCta.trim() || null,
        openStatusLabel: landingOpenLabel.trim() || null,
        closedStatusLabel: landingClosedLabel.trim() || null,
        uiLocale: landingUiLocale.trim() || null,
      };
      const hasLandingContent = Object.values(landingContentPayload).some((v) => v != null);

      let afterSave = await api.tenantMobileConfig.update(tenantId, {
        pageTitle: pageTitle.trim() === "" ? null : pageTitle.trim(),
        themeOverride,
        landingContent: hasLandingContent ? landingContentPayload : null,
      });

      if (faviconFile) {
        if (!ICO_TYPES.has(faviconFile.type)) {
          setFaviconError(t("mobileConfiguration.errors.invalidFaviconType"));

          throw new Error("favicon-type");
        }

        if (!faviconFile.name.toLowerCase().endsWith(".ico")) {
          setFaviconError(t("mobileConfiguration.errors.invalidFaviconExtension"));

          throw new Error("favicon-ext");
        }

        const presign = await api.tenantMobileConfig.presignFavicon(tenantId, faviconFile.type);
        const put = await fetch(presign.uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": faviconFile.type },
          body: faviconFile,
        });

        if (!put.ok) {
          setFaviconError(t("mobileConfiguration.errors.faviconUploadFailed"));

          throw new Error("favicon-upload");
        }

        afterSave = await api.tenantMobileConfig.finalizeFavicon(tenantId, presign.objectKey);
        setFaviconFile(null);
        setFaviconError("");
      }

      return afterSave;
    },
    onSuccess: () => {
      showToast(
        "success",
        t("mobileConfiguration.toast.saveSuccessTitle"),
        t("mobileConfiguration.toast.saveSuccessBody"),
      );

      setFaviconPreviewNonce(Date.now());

      if (tenantId) {
        void queryClient.invalidateQueries({ queryKey: mobileConfigQueryKey(tenantId) });
      }
    },
    onError: (err: unknown) => {
      if (err instanceof Error && err.message === "font") {
        return;
      }

      if (err instanceof Error && err.message.startsWith("favicon")) {
        return;
      }

      showToast("error", t("mobileConfiguration.toast.saveErrorTitle"), t("mobileConfiguration.toast.saveErrorBody"));
    },
  });

  const copyMutation = useMutation({
    mutationFn: async () => {
      if (!tenantId || !copySourceId) {
        throw new Error("missing");
      }

      return api.tenantMobileConfig.copyThemeFrom(tenantId, copySourceId);
    },
    onSuccess: (data) => {
      const { light, dark } = readThemeOverrideIntoModeFields(data.themeOverride);

      setThemeLight(light);
      setThemeDark(dark);

      const override = data.themeOverride;

      if (override && typeof override === "object") {
        const typography = override.typography as Record<string, Record<string, string>> | undefined;

        setGoogleFontUrl(typography?.fontFamily?.googleFontUrl ?? "");
      } else {
        setGoogleFontUrl("");
      }

      setFontError("");

      showToast(
        "success",
        t("mobileConfiguration.toast.copySuccessTitle"),
        t("mobileConfiguration.toast.copySuccessBody"),
      );

      if (tenantId) {
        void queryClient.invalidateQueries({ queryKey: mobileConfigQueryKey(tenantId) });
      }
    },
    onError: () => {
      showToast("error", t("mobileConfiguration.toast.copyErrorTitle"), t("mobileConfiguration.toast.copyErrorBody"));
    },
  });

  const handleFaviconChange = (event: ChangeEvent<HTMLInputElement>): void => {
    setFaviconError("");
    const file = event.target.files?.[0] ?? null;

    setFaviconFile(file);
    event.target.value = "";
  };

  const handleSubmit = (event: FormEvent): void => {
    event.preventDefault();
    saveMutation.mutate();
  };

  const handleCopyTheme = useCallback((): void => {
    if (!copySourceId) {
      return;
    }

    copyMutation.mutate();
  }, [copyMutation, copySourceId]);

  const copyThemeSelectedName = copySourceId ? otherTenants.find((x) => x.id === copySourceId)?.name : undefined;

  const copyThemeTriggerDisplay = copyThemeSelectedName ?? "";

  const copyThemeTriggerAriaLabel = copyThemeSelectedName ?? t("mobileConfiguration.copySection.placeholder");

  const savedFaviconPreviewSrc =
    selectedTenant?.slug && config?.hasFavicon && !faviconFile
      ? `${resolveApiBaseUrl({ preferRelativeInBrowser: true })}/public/${selectedTenant.slug}/favicon.ico?t=${faviconPreviewNonce}`
      : null;

  const faviconPreviewSrc = faviconObjectUrl ?? savedFaviconPreviewSrc;

  const canSave = tenantId !== null && !saveMutation.isPending;

  const previewThemeOverride = useMemo((): ThemeOverride | null => {
    const raw = buildMobileThemeOverride(themeLight, themeDark, googleFontUrl);

    if (!raw) {
      return null;
    }

    return raw as ThemeOverride;
  }, [themeLight, themeDark, googleFontUrl]);

  const previewAppearance = themePersonalizationMode;

  const previewTablesCopy = useMemo(
    () => ({
      backLabel: t("mobileConfiguration.preview.tables.back"),
      subtitle: t("mobileConfiguration.preview.tables.subtitle"),
      floorTitle: t("mobileConfiguration.preview.tables.floorTitle"),
      listTitle: t("mobileConfiguration.preview.tables.listTitle"),
      sampleOpenTableLabel: t("mobileConfiguration.preview.tables.sampleOpen"),
      sampleClosedTableLabel: t("mobileConfiguration.preview.tables.sampleClosed"),
    }),
    [t],
  );

  const previewMenuCopy = useMemo(
    () => ({
      backLabel: t("mobileConfiguration.preview.menu.back"),
      subtitle: t("mobileConfiguration.preview.menu.subtitle"),
      categoryName: t("mobileConfiguration.preview.menu.category"),
      items: [
        {
          name: t("mobileConfiguration.preview.menu.item1Name"),
          description: t("mobileConfiguration.preview.menu.item1Desc"),
          priceLabel: t("mobileConfiguration.preview.menu.item1Price"),
          promoted: true,
        },
        {
          name: t("mobileConfiguration.preview.menu.item2Name"),
          priceLabel: t("mobileConfiguration.preview.menu.item2Price"),
        },
      ],
      navHomeLabel: t("mobileConfiguration.preview.navHome"),
      navTablesLabel: t("mobileConfiguration.preview.navTables"),
      promotedBadgeLabel: t("mobileConfiguration.preview.menu.promotedBadge"),
    }),
    [t],
  );

  const previewOrderCopy = useMemo(
    () => ({
      tableCaption: t("mobileConfiguration.preview.order.tableCaption"),
      cartButtonLabel: t("mobileConfiguration.preview.order.cartButton"),
      summaryTitle: t("mobileConfiguration.preview.order.summaryTitle"),
      categoryName: t("mobileConfiguration.preview.order.category"),
      items: [
        {
          name: t("mobileConfiguration.preview.order.item1Name"),
          priceLabel: t("mobileConfiguration.preview.order.item1Price"),
        },
        {
          name: t("mobileConfiguration.preview.order.item2Name"),
          priceLabel: t("mobileConfiguration.preview.order.item2Price"),
        },
      ],
      promotedBadgeLabel: t("mobileConfiguration.preview.menu.promotedBadge"),
      subtotalLabel: t("mobileConfiguration.preview.order.subtotalLabel"),
      subtotalPrice: t("mobileConfiguration.preview.order.subtotalPrice"),
      serviceLabel: t("mobileConfiguration.preview.order.serviceLabel"),
      servicePrice: t("mobileConfiguration.preview.order.servicePrice"),
      totalLabel: t("mobileConfiguration.preview.order.totalLabel"),
      totalPrice: t("mobileConfiguration.preview.order.totalPrice"),
    }),
    [t],
  );

  return (
    <PageLayout
      title={t("mobileConfiguration.title")}
      description={t("mobileConfiguration.description")}
      headerActions={
        <FormActions>
          <Button type="submit" form="mobile-config-form" disabled={!canSave}>
            {saveMutation.isPending ? t("mobileConfiguration.actions.saving") : t("mobileConfiguration.actions.save")}
          </Button>
        </FormActions>
      }
    >
      <div className="mx-auto min-h-0 min-w-0 max-w-7xl p-6">
        {tenantId === null && (
          <div className="rounded-lg border border-status-warning-border bg-status-warning-background px-4 py-3 text-sm text-status-warning-text">
            {t("mobileConfiguration.errors.selectRestaurant")}
          </div>
        )}

        {isLoading && tenantId !== null && (
          <div className="flex items-center gap-2 text-sm text-text-tertiary">
            <Loader size="sm" />
            <span>{t("mobileConfiguration.loading")}</span>
          </div>
        )}

        <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_min(100%,380px)] lg:items-start lg:gap-10">
          <form id="mobile-config-form" onSubmit={handleSubmit} className="min-w-0 space-y-6">
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary" htmlFor="mobile-page-title">
                {t("mobileConfiguration.fields.pageTitle")}
              </label>
              <input
                id="mobile-page-title"
                value={pageTitle}
                onChange={(e) => setPageTitle(e.target.value)}
                className="w-full rounded-md border border-border-default bg-surface-primary px-3 py-2 text-sm text-text-primary"
                placeholder={t("mobileConfiguration.placeholders.pageTitle")}
              />
              <p className="mt-1 text-xs text-text-tertiary">{t("mobileConfiguration.hints.pageTitle")}</p>
            </div>

            <div className="rounded-lg border border-border-default bg-surface-secondary/40 p-4">
              <p className="mb-3 text-sm font-medium text-text-primary">
                {t("mobileConfiguration.landingSection.title")}
              </p>
              <p className="mb-4 text-xs text-text-tertiary">{t("mobileConfiguration.landingSection.hint")}</p>
              <div className="space-y-3">
                <div>
                  <label
                    className="mb-1 block text-xs font-medium text-text-secondary"
                    htmlFor="mobile-landing-headline"
                  >
                    {t("mobileConfiguration.fields.landingHeadline")}
                  </label>
                  <input
                    id="mobile-landing-headline"
                    value={landingHeadline}
                    onChange={(e) => setLandingHeadline(e.target.value)}
                    className="w-full rounded-md border border-border-default bg-surface-primary px-3 py-2 text-sm text-text-primary"
                  />
                </div>
                <div>
                  <label
                    className="mb-1 block text-xs font-medium text-text-secondary"
                    htmlFor="mobile-landing-subtitle"
                  >
                    {t("mobileConfiguration.fields.landingSubtitle")}
                  </label>
                  <textarea
                    id="mobile-landing-subtitle"
                    value={landingSubtitle}
                    onChange={(e) => setLandingSubtitle(e.target.value)}
                    rows={3}
                    className="w-full rounded-md border border-border-default bg-surface-primary px-3 py-2 text-sm text-text-primary"
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label
                      className="mb-1 block text-xs font-medium text-text-secondary"
                      htmlFor="mobile-landing-tables-cta"
                    >
                      {t("mobileConfiguration.fields.tablesCtaLabel")}
                    </label>
                    <input
                      id="mobile-landing-tables-cta"
                      value={landingTablesCta}
                      onChange={(e) => setLandingTablesCta(e.target.value)}
                      className="w-full rounded-md border border-border-default bg-surface-primary px-3 py-2 text-sm text-text-primary"
                    />
                  </div>
                  <div>
                    <label
                      className="mb-1 block text-xs font-medium text-text-secondary"
                      htmlFor="mobile-landing-menu-cta"
                    >
                      {t("mobileConfiguration.fields.menuCtaLabel")}
                    </label>
                    <input
                      id="mobile-landing-menu-cta"
                      value={landingMenuCta}
                      onChange={(e) => setLandingMenuCta(e.target.value)}
                      className="w-full rounded-md border border-border-default bg-surface-primary px-3 py-2 text-sm text-text-primary"
                    />
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-text-secondary" htmlFor="mobile-landing-open">
                      {t("mobileConfiguration.fields.openStatusLabel")}
                    </label>
                    <input
                      id="mobile-landing-open"
                      value={landingOpenLabel}
                      onChange={(e) => setLandingOpenLabel(e.target.value)}
                      className="w-full rounded-md border border-border-default bg-surface-primary px-3 py-2 text-sm text-text-primary"
                    />
                  </div>
                  <div>
                    <label
                      className="mb-1 block text-xs font-medium text-text-secondary"
                      htmlFor="mobile-landing-closed"
                    >
                      {t("mobileConfiguration.fields.closedStatusLabel")}
                    </label>
                    <input
                      id="mobile-landing-closed"
                      value={landingClosedLabel}
                      onChange={(e) => setLandingClosedLabel(e.target.value)}
                      className="w-full rounded-md border border-border-default bg-surface-primary px-3 py-2 text-sm text-text-primary"
                    />
                  </div>
                </div>
                <div>
                  <label
                    className="mb-1 block text-xs font-medium text-text-secondary"
                    htmlFor="mobile-landing-ui-locale"
                  >
                    {t("mobileConfiguration.fields.uiLocale")}
                  </label>
                  <select
                    id="mobile-landing-ui-locale"
                    value={landingUiLocale}
                    onChange={(e) => setLandingUiLocale(e.target.value)}
                    className="w-full rounded-md border border-border-default bg-surface-primary px-3 py-2 text-sm text-text-primary"
                  >
                    <option value="">{t("mobileConfiguration.fields.uiLocaleBrowserDefault")}</option>
                    <option value="en">{t("languageSwitcher.options.en")}</option>
                    <option value="pl">{t("languageSwitcher.options.pl")}</option>
                  </select>
                  <p className="mt-1 text-xs text-text-tertiary">{t("mobileConfiguration.hints.uiLocale")}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-6">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-end gap-3">
                  <div className="min-w-0 flex-1">
                    <FilePickerField
                      label={t("mobileConfiguration.fields.favicon")}
                      labelTooltip={t("mobileConfiguration.hints.favicon")}
                      accept=".ico,image/x-icon,image/vnd.microsoft.icon"
                      onChange={handleFaviconChange}
                      disabled={saveMutation.isPending}
                      busy={saveMutation.isPending}
                      idleLabel={t("mobileConfiguration.actions.chooseFile")}
                      busyLabel={t("mobileConfiguration.actions.saving")}
                      error={faviconError || undefined}
                      labelClassName="text-xs text-text-secondary"
                      buttonClassName="text-sm"
                    />
                  </div>
                  {faviconPreviewSrc ? (
                    <img
                      src={faviconPreviewSrc}
                      alt={t("mobileConfiguration.hints.faviconPreviewAlt")}
                      className="size-14 shrink-0 p-1 border border-border-default bg-surface-primary object-contain"
                    />
                  ) : null}
                </div>
                {faviconFile && (
                  <p className="mt-1 text-xs text-text-tertiary">
                    {t("mobileConfiguration.hints.faviconSelected", { name: faviconFile.name })}
                  </p>
                )}
                {config?.hasFavicon && !faviconFile && (
                  <p className="mt-1 text-xs text-text-tertiary">{t("mobileConfiguration.hints.faviconCurrent")}</p>
                )}
              </div>
              <div className="w-full shrink-0 rounded-lg border border-border-default bg-surface-secondary/60 p-4 lg:max-w-md">
                <p className="mb-2 text-sm font-medium text-text-primary">
                  {t("mobileConfiguration.copySection.title")}
                </p>
                <div className="flex flex-wrap items-end gap-2">
                  <div className="min-w-[200px] flex-1">
                    <label className="mb-1 block text-xs font-medium text-text-secondary" htmlFor="copy-theme-trigger">
                      {t("mobileConfiguration.copySection.source")}
                    </label>
                    {otherTenants.length === 0 ? (
                      <Button
                        id="copy-theme-trigger"
                        type="button"
                        variant="outline"
                        disabled
                        className="w-full justify-between gap-2 font-normal"
                        aria-label={copyThemeTriggerAriaLabel}
                      >
                        <span className="min-w-0 truncate text-left">{copyThemeTriggerDisplay || "\u00a0"}</span>
                        <TbChevronDown className="size-4 shrink-0 text-text-secondary" aria-hidden />
                      </Button>
                    ) : (
                      <div className="w-full [&>div]:block [&>div]:w-full">
                        <Dropdown
                          trigger={
                            <Button
                              id="copy-theme-trigger"
                              type="button"
                              variant="outline"
                              className="w-full justify-between gap-2 font-normal"
                              aria-label={copyThemeTriggerAriaLabel}
                            >
                              <span className="min-w-0 truncate text-left">{copyThemeTriggerDisplay || "\u00a0"}</span>
                              <TbChevronDown className="size-4 shrink-0 text-text-secondary" aria-hidden />
                            </Button>
                          }
                          placement="bottom-start"
                          className="max-h-60 w-full min-w-full overflow-y-auto p-1"
                          closeOnSelect
                        >
                          <button
                            type="button"
                            className="w-full rounded-sm px-2 py-1.5 text-left text-sm text-text-tertiary hover:bg-surface-secondary"
                            onClick={() => setCopySourceId("")}
                          >
                            {t("mobileConfiguration.copySection.placeholder")}
                          </button>
                          {otherTenants.map((tenant) => (
                            <button
                              key={tenant.id}
                              type="button"
                              className="w-full rounded-sm px-2 py-1.5 text-left text-sm hover:bg-surface-secondary"
                              onClick={() => setCopySourceId(tenant.id)}
                            >
                              {tenant.name}
                            </button>
                          ))}
                        </Dropdown>
                      </div>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={!copySourceId || copyMutation.isPending}
                    onClick={handleCopyTheme}
                  >
                    {copyMutation.isPending
                      ? t("mobileConfiguration.copySection.copying")
                      : t("mobileConfiguration.copySection.copy")}
                  </Button>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-border-default bg-surface-secondary/40 p-4">
              <p className="mb-4 text-sm font-medium text-text-primary">
                {t("mobileConfiguration.themeSection.title")}
              </p>

              <div className="mb-4">
                <p className="mb-2 text-xs font-medium text-text-secondary">
                  {t("mobileConfiguration.themeSection.editTargetLabel")}
                </p>
                <div className="flex max-w-md rounded-lg border border-border-default bg-surface-primary p-0.5">
                  <button
                    type="button"
                    onClick={() => setThemePersonalizationMode("light")}
                    className={cn(
                      "flex-1 rounded-md px-3 py-2 text-xs font-medium transition-colors",
                      themePersonalizationMode === "light"
                        ? "bg-interactive-primary text-interactive-primaryForeground"
                        : "text-text-secondary hover:bg-surface-secondary/80",
                    )}
                  >
                    {t("mobileConfiguration.themeSection.editLight")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setThemePersonalizationMode("dark")}
                    className={cn(
                      "flex-1 rounded-md px-3 py-2 text-xs font-medium transition-colors",
                      themePersonalizationMode === "dark"
                        ? "bg-interactive-primary text-interactive-primaryForeground"
                        : "text-text-secondary hover:bg-surface-secondary/80",
                    )}
                  >
                    {t("mobileConfiguration.themeSection.editDark")}
                  </button>
                </div>
                <p className="mt-2 text-xs text-text-tertiary">
                  {t("mobileConfiguration.hints.themePersonalizationMode")}
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-text-secondary" htmlFor="mobile-bg-color">
                    {t("mobileConfiguration.fields.backgroundColor")}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      id="mobile-bg-color"
                      type="color"
                      value={
                        activeMobileTheme.backgroundColor ||
                        (themePersonalizationMode === "light" ? "#ffffff" : PICKER_FALLBACK_DARK_BG)
                      }
                      onChange={(e) => patchActiveMobileTheme({ backgroundColor: e.target.value })}
                      className="h-10 w-14 cursor-pointer rounded-sm border border-border-default bg-surface-primary p-1"
                    />
                    <input
                      type="text"
                      value={activeMobileTheme.backgroundColor}
                      onChange={(e) => patchActiveMobileTheme({ backgroundColor: e.target.value })}
                      placeholder={themePersonalizationMode === "light" ? "#ffffff" : PICKER_FALLBACK_DARK_BG}
                      className="flex-1 rounded-md border border-border-default bg-surface-primary px-3 py-2 text-sm text-text-primary font-mono"
                    />
                    {activeMobileTheme.backgroundColor ? (
                      <button
                        type="button"
                        onClick={() => patchActiveMobileTheme({ backgroundColor: "" })}
                        className="text-xs text-text-tertiary hover:text-text-secondary"
                      >
                        {t("mobileConfiguration.actions.clear")}
                      </button>
                    ) : null}
                  </div>
                  <p className="mt-1 text-xs text-text-tertiary">{t("mobileConfiguration.hints.backgroundColor")}</p>
                </div>

                <div className="space-y-4 border-t border-border-default pt-4">
                  <p className="text-xs font-medium text-text-primary">
                    {t("mobileConfiguration.themeSection.primaryButton")}
                  </p>
                  <ThemeColorField
                    id="mobile-primary-button-bg"
                    label={t("mobileConfiguration.fields.primaryButtonBackground")}
                    hint={t("mobileConfiguration.hints.primaryButtonBackground")}
                    value={activeMobileTheme.primaryButtonBg}
                    onChange={(v) => patchActiveMobileTheme({ primaryButtonBg: v })}
                    pickerFallback={
                      themePersonalizationMode === "light"
                        ? PICKER_FALLBACK_PRIMARY_BG
                        : PICKER_FALLBACK_DARK_PRIMARY_BG
                    }
                    clearLabel={t("mobileConfiguration.actions.clear")}
                  />
                  <ThemeColorField
                    id="mobile-primary-button-text"
                    label={t("mobileConfiguration.fields.primaryButtonText")}
                    hint={t("mobileConfiguration.hints.primaryButtonText")}
                    value={activeMobileTheme.primaryButtonText}
                    onChange={(v) => patchActiveMobileTheme({ primaryButtonText: v })}
                    pickerFallback={
                      themePersonalizationMode === "light"
                        ? PICKER_FALLBACK_PRIMARY_TEXT
                        : PICKER_FALLBACK_DARK_PRIMARY_TEXT
                    }
                    clearLabel={t("mobileConfiguration.actions.clear")}
                  />
                  <p className="text-xs font-medium text-text-primary">
                    {t("mobileConfiguration.themeSection.secondaryButton")}
                  </p>
                  <ThemeColorField
                    id="mobile-secondary-button-bg"
                    label={t("mobileConfiguration.fields.secondaryButtonBackground")}
                    hint={t("mobileConfiguration.hints.secondaryButtonBackground")}
                    value={activeMobileTheme.secondaryButtonBg}
                    onChange={(v) => patchActiveMobileTheme({ secondaryButtonBg: v })}
                    pickerFallback={
                      themePersonalizationMode === "light"
                        ? PICKER_FALLBACK_SECONDARY_BG
                        : PICKER_FALLBACK_DARK_SECONDARY_BG
                    }
                    clearLabel={t("mobileConfiguration.actions.clear")}
                  />
                  <ThemeColorField
                    id="mobile-secondary-button-text"
                    label={t("mobileConfiguration.fields.secondaryButtonText")}
                    hint={t("mobileConfiguration.hints.secondaryButtonText")}
                    value={activeMobileTheme.secondaryButtonText}
                    onChange={(v) => patchActiveMobileTheme({ secondaryButtonText: v })}
                    pickerFallback={
                      themePersonalizationMode === "light"
                        ? PICKER_FALLBACK_SECONDARY_TEXT
                        : PICKER_FALLBACK_DARK_SECONDARY_TEXT
                    }
                    clearLabel={t("mobileConfiguration.actions.clear")}
                  />
                </div>

                <div className="space-y-4 border-t border-border-default pt-4">
                  <p className="text-xs font-medium text-text-primary">
                    {t("mobileConfiguration.themeSection.surfacesTextAndBorders")}
                  </p>
                  <ThemeColorField
                    id="mobile-text-primary"
                    label={t("mobileConfiguration.fields.textPrimary")}
                    hint={t("mobileConfiguration.hints.textPrimary")}
                    value={activeMobileTheme.textPrimary}
                    onChange={(v) => patchActiveMobileTheme({ textPrimary: v })}
                    pickerFallback={
                      themePersonalizationMode === "light"
                        ? PICKER_FALLBACK_TEXT_PRIMARY
                        : PICKER_FALLBACK_DARK_TEXT_PRIMARY
                    }
                    clearLabel={t("mobileConfiguration.actions.clear")}
                  />
                  <ThemeColorField
                    id="mobile-text-secondary"
                    label={t("mobileConfiguration.fields.textSecondary")}
                    hint={t("mobileConfiguration.hints.textSecondary")}
                    value={activeMobileTheme.textSecondary}
                    onChange={(v) => patchActiveMobileTheme({ textSecondary: v })}
                    pickerFallback={
                      themePersonalizationMode === "light"
                        ? PICKER_FALLBACK_TEXT_SECONDARY
                        : PICKER_FALLBACK_DARK_TEXT_SECONDARY
                    }
                    clearLabel={t("mobileConfiguration.actions.clear")}
                  />
                  <ThemeColorField
                    id="mobile-text-tertiary"
                    label={t("mobileConfiguration.fields.textTertiary")}
                    hint={t("mobileConfiguration.hints.textTertiary")}
                    value={activeMobileTheme.textTertiary}
                    onChange={(v) => patchActiveMobileTheme({ textTertiary: v })}
                    pickerFallback={
                      themePersonalizationMode === "light"
                        ? PICKER_FALLBACK_TEXT_TERTIARY
                        : PICKER_FALLBACK_DARK_TEXT_TERTIARY
                    }
                    clearLabel={t("mobileConfiguration.actions.clear")}
                  />
                  <ThemeColorField
                    id="mobile-border-default"
                    label={t("mobileConfiguration.fields.borderDefault")}
                    hint={t("mobileConfiguration.hints.borderDefault")}
                    value={activeMobileTheme.borderDefault}
                    onChange={(v) => patchActiveMobileTheme({ borderDefault: v })}
                    pickerFallback={
                      themePersonalizationMode === "light" ? PICKER_FALLBACK_BORDER : PICKER_FALLBACK_DARK_BORDER
                    }
                    clearLabel={t("mobileConfiguration.actions.clear")}
                  />
                  <ThemeColorField
                    id="mobile-surface-primary"
                    label={t("mobileConfiguration.fields.surfacePrimary")}
                    hint={t("mobileConfiguration.hints.surfacePrimary")}
                    value={activeMobileTheme.surfacePrimary}
                    onChange={(v) => patchActiveMobileTheme({ surfacePrimary: v })}
                    pickerFallback={
                      themePersonalizationMode === "light"
                        ? PICKER_FALLBACK_SURFACE_PRIMARY
                        : PICKER_FALLBACK_DARK_SURFACE_PRIMARY
                    }
                    clearLabel={t("mobileConfiguration.actions.clear")}
                  />
                  <ThemeColorField
                    id="mobile-surface-secondary"
                    label={t("mobileConfiguration.fields.surfaceSecondary")}
                    hint={t("mobileConfiguration.hints.surfaceSecondary")}
                    value={activeMobileTheme.surfaceSecondary}
                    onChange={(v) => patchActiveMobileTheme({ surfaceSecondary: v })}
                    pickerFallback={
                      themePersonalizationMode === "light"
                        ? PICKER_FALLBACK_SURFACE_SECONDARY
                        : PICKER_FALLBACK_DARK_SURFACE_SECONDARY
                    }
                    clearLabel={t("mobileConfiguration.actions.clear")}
                  />
                </div>

                <div className="space-y-4 border-t border-border-default pt-4">
                  <p className="text-xs font-medium text-text-primary">
                    {t("mobileConfiguration.themeSection.promotedBadge")}
                  </p>
                  <ThemeColorField
                    id="mobile-promoted-badge-bg"
                    label={t("mobileConfiguration.fields.promotedBadgeBackground")}
                    hint={t("mobileConfiguration.hints.promotedBadgeBackground")}
                    value={activeMobileTheme.promotedBadgeBackground}
                    onChange={(v) => patchActiveMobileTheme({ promotedBadgeBackground: v })}
                    pickerFallback={
                      themePersonalizationMode === "light"
                        ? PICKER_FALLBACK_PROMOTED_BG
                        : PICKER_FALLBACK_DARK_PROMOTED_BG
                    }
                    clearLabel={t("mobileConfiguration.actions.clear")}
                  />
                  <ThemeColorField
                    id="mobile-promoted-badge-text"
                    label={t("mobileConfiguration.fields.promotedBadgeText")}
                    hint={t("mobileConfiguration.hints.promotedBadgeText")}
                    value={activeMobileTheme.promotedBadgeText}
                    onChange={(v) => patchActiveMobileTheme({ promotedBadgeText: v })}
                    pickerFallback={
                      themePersonalizationMode === "light"
                        ? PICKER_FALLBACK_PROMOTED_TEXT
                        : PICKER_FALLBACK_DARK_PROMOTED_TEXT
                    }
                    clearLabel={t("mobileConfiguration.actions.clear")}
                  />
                  <ThemeColorField
                    id="mobile-promoted-badge-border"
                    label={t("mobileConfiguration.fields.promotedBadgeBorder")}
                    hint={t("mobileConfiguration.hints.promotedBadgeBorder")}
                    value={activeMobileTheme.promotedBadgeBorder}
                    onChange={(v) => patchActiveMobileTheme({ promotedBadgeBorder: v })}
                    pickerFallback={
                      themePersonalizationMode === "light"
                        ? PICKER_FALLBACK_PROMOTED_BORDER
                        : PICKER_FALLBACK_DARK_PROMOTED_BORDER
                    }
                    clearLabel={t("mobileConfiguration.actions.clear")}
                  />
                </div>

                <div>
                  <div className="mb-1 flex items-center gap-1">
                    <label className="block text-xs font-medium text-text-secondary" htmlFor="mobile-google-font">
                      {t("mobileConfiguration.fields.googleFontUrl")}
                    </label>
                    <Tooltip content={t("mobileConfiguration.hints.googleFontUrlTooltip")} placement="right">
                      <button type="button" className="text-text-tertiary hover:text-text-secondary">
                        <TbHelpCircle className="h-4 w-4" />
                      </button>
                    </Tooltip>
                  </div>
                  <input
                    id="mobile-google-font"
                    type="url"
                    value={googleFontUrl}
                    onChange={(e) => {
                      setGoogleFontUrl(e.target.value);
                      setFontError("");
                    }}
                    placeholder="https://fonts.googleapis.com/css2?family=Roboto"
                    className="w-full rounded-md border border-border-default bg-surface-primary px-3 py-2 text-sm text-text-primary"
                  />
                  {fontError && <p className="mt-1 text-xs text-status-error-text">{fontError}</p>}
                  <p className="mt-1 text-xs text-text-tertiary">{t("mobileConfiguration.hints.googleFontUrl")}</p>
                </div>
              </div>
            </div>
          </form>

          {tenantId !== null && !isLoading ? (
            <div className="min-w-0 lg:sticky lg:top-6 lg:z-10 lg:self-start">
              <aside className="w-full lg:w-[min(100%,380px)]">
                <p className="mb-1 text-sm font-medium text-text-primary">{t("mobileConfiguration.preview.title")}</p>
                <p className="mb-3 text-xs text-text-tertiary">{t("mobileConfiguration.preview.hint")}</p>
                <div className="mb-4 space-y-2">
                  <div className="min-w-0">
                    <p className="mb-1 text-xs font-medium text-text-secondary">
                      {t("mobileConfiguration.preview.screenLabel")}
                    </p>
                    <div className="w-full [&>div]:block [&>div]:w-full">
                      <Dropdown
                        trigger={
                          <Button
                            id="mobile-preview-screen"
                            type="button"
                            variant="outline"
                            className="w-full justify-between gap-2 font-normal"
                            aria-label={t("mobileConfiguration.preview.screenLabel")}
                          >
                            <span className="min-w-0 truncate text-left">
                              {t(`mobileConfiguration.preview.screens.${previewScreen}`)}
                            </span>
                            <TbChevronDown className="size-4 shrink-0 text-text-secondary" aria-hidden />
                          </Button>
                        }
                        placement="bottom-start"
                        className="max-h-60 w-full min-w-full overflow-y-auto p-1"
                        closeOnSelect
                      >
                        {(["landing", "tables", "menu", "order"] as const).map((value) => (
                          <button
                            key={value}
                            type="button"
                            className="w-full rounded-sm px-2 py-1.5 text-left text-sm hover:bg-surface-secondary"
                            onClick={() => setPreviewScreen(value)}
                          >
                            {t(`mobileConfiguration.preview.screens.${value}`)}
                          </button>
                        ))}
                      </Dropdown>
                    </div>
                  </div>
                </div>
                <MobileGuestAppPreview
                  screen={previewScreen}
                  appearance={previewAppearance}
                  restaurantName={selectedTenant?.name ?? ""}
                  pageTitle={pageTitle}
                  landingHeadline={landingHeadline}
                  landingSubtitle={landingSubtitle}
                  defaultSubtitle={t("mobileConfiguration.preview.defaultSubtitle")}
                  tablesCtaLabel={landingTablesCta}
                  menuCtaLabel={landingMenuCta}
                  tablesCtaDefault={t("mobileConfiguration.preview.ctaTables")}
                  menuCtaDefault={t("mobileConfiguration.preview.ctaMenu")}
                  navTablesLabel={t("mobileConfiguration.preview.navTables")}
                  navMenuLabel={t("mobileConfiguration.preview.navMenu")}
                  navHomeLabel={t("mobileConfiguration.preview.navHome")}
                  quickNavAriaLabel={t("mobileConfiguration.preview.quickNavAria")}
                  languageSwitcherAriaLabel={t("languageSwitcher.label")}
                  openStatusLabel={landingOpenLabel.trim() || t("mobileConfiguration.preview.openStatusFallback")}
                  closedStatusLabel={landingClosedLabel.trim() || t("mobileConfiguration.preview.closedStatusFallback")}
                  tablesCopy={previewTablesCopy}
                  menuCopy={previewMenuCopy}
                  orderCopy={previewOrderCopy}
                  themeOverride={previewThemeOverride}
                  googleFontStylesheetHref={googleFontUrl.trim() || undefined}
                />
              </aside>
            </div>
          ) : null}
        </div>
      </div>
    </PageLayout>
  );
};
