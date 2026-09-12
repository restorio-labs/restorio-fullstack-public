"use client";

import { Button, cn, ContentContainer, Loader, Text, useAuthRoute, type AuthRouteStatus } from "@restorio/ui";
import { goToApp } from "@restorio/utils";
import Link from "next/link";
import type { ReactElement } from "react";
import { FaBolt, FaChartLine, FaCheck, FaCirclePlay, FaCode, FaHeart, FaLeaf, FaUtensils } from "react-icons/fa6";

import { useLocale, useTranslations } from "@/i18n/useT";

export const HomeContent = (): ReactElement => {
  const { authStatus }: { authStatus: AuthRouteStatus } = useAuthRoute();
  const t = useTranslations();
  const locale = useLocale();
  const animatedSectionClassName = "onboarding-fade-up-slow motion-reduce:animate-none";

  return (
    <div className="flex flex-col">
      <section className="relative flex flex-col items-center overflow-hidden pb-16 pt-8 md:pb-24 md:pt-12">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div
            className="absolute left-1/2 top-0 h-full w-full max-w-6xl -translate-x-1/2"
            style={{
              background: "radial-gradient(circle at center, rgba(137, 172, 255, 0.08) 0%, transparent 70%)",
            }}
          />
        </div>

        <div
          className={cn(
            "relative z-10 w-full max-w-5xl space-y-8 px-4 text-center sm:px-6 lg:px-8",
            animatedSectionClassName,
          )}
          style={{ animationDelay: "140ms" }}
        >
          <Text
            as="h1"
            variant="h1"
            align="center"
            className="text-5xl font-black leading-[0.9] tracking-tight text-text-primary md:text-7xl lg:text-8xl"
          >
            {t.rich("landing.hero.title", {
              br: () => <br />,
              accent: (chunks) => <span className="text-interactive-primary italic">{chunks}</span>,
            })}
          </Text>

          <Text
            variant="body-lg"
            className="text-center mx-auto max-w-2xl text-lg font-medium leading-relaxed text-text-secondary md:text-xl"
          >
            {t("landing.hero.subtitle")}
          </Text>
        </div>

        <ContentContainer
          maxWidth="xl"
          padding
          className={cn("relative z-10 mt-12 sm:mt-16 md:mt-20", animatedSectionClassName)}
          style={{ animationDelay: "320ms" }}
        >
          <div id="landing-preview" className="relative mx-auto w-full max-w-6xl scroll-mt-24">
            <div className="absolute -inset-1 rounded-[3rem] bg-gradient-to-r from-[#89acff]/10 to-[#85f6e5]/10 opacity-30 blur-3xl" />
            <div className="glass-card relative flex aspect-video flex-col overflow-hidden rounded-[2.5rem] border border-[#44484f]/20 shadow-2xl">
              <div className="flex h-12 items-center gap-2.5 border-b border-[#44484f]/10 bg-[#20262f]/40 px-6 sm:px-8">
                <span className="h-3 w-3 shrink-0 rounded-full bg-[#d7383b]/60" aria-hidden />
                <span className="h-3 w-3 shrink-0 rounded-full bg-[#ff8762]/60" aria-hidden />
                <span className="h-3 w-3 shrink-0 rounded-full bg-[#85f6e5]/60" aria-hidden />
                <div className="ml-4 h-6 max-w-md flex-1 rounded-full bg-black/30" />
              </div>
              <div className="flex flex-1 items-center justify-center bg-gradient-to-b from-transparent to-[#0f141a]/20">
                <div className="flex flex-col items-center gap-4 opacity-40">
                  <FaCirclePlay className="text-6xl text-[#89acff]" aria-hidden />
                  <p className="text-sm font-medium uppercase tracking-widest text-[#a8abb3]">
                    {t("landing.hero.previewLabel")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </ContentContainer>
      </section>

      <section id="landing-mission" className="scroll-mt-24 px-4 py-20 md:py-28">
        <ContentContainer
          maxWidth="lg"
          padding
          className={animatedSectionClassName}
          style={{ animationDelay: "500ms" }}
        >
          <div className="mx-auto max-w-3xl text-center">
            <Text variant="h2" weight="bold" className="mb-6 text-3xl font-black md:text-5xl">
              {t("landing.mission.title")}
            </Text>
            <Text variant="body-lg" className="text-text-secondary">
              {t("landing.mission.body")}
            </Text>
          </div>
          <div className="mx-auto mt-14 grid max-w-4xl gap-8 md:grid-cols-2">
            <div className="space-y-4 rounded-2xl border border-border-default/40 bg-surface-secondary/40 p-8 text-left">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-interactive-primary/15 text-interactive-primary">
                <FaBolt className="h-6 w-6" aria-hidden />
              </div>
              <Text variant="h3" weight="semibold" className="text-xl">
                {t("landing.mission.goalsTitle")}
              </Text>
              <Text variant="body-md" className="text-text-secondary">
                {t("landing.mission.goalsBody")}
              </Text>
            </div>
            <div className="space-y-4 rounded-2xl border border-border-default/40 bg-surface-secondary/40 p-8 text-left">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-interactive-secondary/15 text-interactive-secondary">
                <FaLeaf className="h-6 w-6" aria-hidden />
              </div>
              <Text variant="h3" weight="semibold" className="text-xl">
                {t("landing.mission.sustainTitle")}
              </Text>
              <Text variant="body-md" className="text-text-secondary">
                {t("landing.mission.sustainBody")}
              </Text>
            </div>
          </div>
        </ContentContainer>
      </section>

      <section id="landing-ecosystem" className="scroll-mt-24 bg-surface-secondary/50 px-4 py-20 md:py-28">
        <ContentContainer
          maxWidth="xl"
          padding
          className={animatedSectionClassName}
          style={{ animationDelay: "680ms" }}
        >
          <div className="mb-14 text-center">
            <Text variant="h2" weight="bold" className="text-center mb-4 text-3xl font-black md:text-5xl">
              {t("landing.pillars.title")}
            </Text>
          </div>
          <div className="grid gap-10 lg:grid-cols-3 lg:gap-8">
            {(
              [
                {
                  title: t("landing.pillars.ownersTitle"),
                  body: t("landing.pillars.ownersBody"),
                  bullets: [
                    t("landing.pillars.ownersB1"),
                    t("landing.pillars.ownersB2"),
                    t("landing.pillars.ownersB3"),
                  ],
                  ring: "border-border-default/30",
                  accent: "text-interactive-primary",
                  iconBg: "bg-interactive-primary/15",
                  IconComponent: FaChartLine,
                  featured: false,
                },
                {
                  title: t("landing.pillars.staffTitle"),
                  body: t("landing.pillars.staffBody"),
                  bullets: [t("landing.pillars.staffB1"), t("landing.pillars.staffB2"), t("landing.pillars.staffB3")],
                  ring: "border-interactive-primary/25",
                  accent: "text-interactive-secondary",
                  iconBg: "bg-interactive-secondary/15",
                  IconComponent: FaUtensils,
                  featured: true,
                },
                {
                  title: t("landing.pillars.guestsTitle"),
                  body: t("landing.pillars.guestsBody"),
                  bullets: [
                    t("landing.pillars.guestsB1"),
                    t("landing.pillars.guestsB2"),
                    t("landing.pillars.guestsB3"),
                  ],
                  ring: "border-border-default/30",
                  accent: "text-pink-500",
                  iconBg: "bg-pink-500/15",
                  IconComponent: FaHeart,
                  featured: false,
                },
              ] as const
            ).map((card) => (
              <div
                key={card.title}
                className={cn(
                  "flex flex-col rounded-[2rem] border bg-surface-primary/80 p-10 text-center transition-transform duration-500 hover:-translate-y-1",
                  card.ring,
                  card.featured ? "hearth-glow scale-[1.02] shadow-2xl lg:scale-105" : "shadow-lg",
                )}
              >
                <div
                  className={cn(
                    "mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full",
                    card.iconBg,
                    card.accent,
                  )}
                >
                  <card.IconComponent className="h-8 w-8" aria-hidden />
                </div>
                <Text variant="h3" weight="bold" className="mb-3 text-xl font-black">
                  {card.title}
                </Text>
                <Text variant="body-md" className="mb-6 text-text-secondary">
                  {card.body}
                </Text>
                <ul className="mt-auto space-y-3 border-t border-border-default/25 pt-6 text-left text-sm">
                  {card.bullets.map((line) => (
                    <li key={line} className="flex items-center gap-3">
                      <FaCheck className={cn("h-4 w-4 shrink-0", card.accent)} aria-hidden />
                      <span className="text-text-secondary">{line}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </ContentContainer>
      </section>

      <section id="landing-precision" className="scroll-mt-24 px-4 py-20 md:py-28">
        <ContentContainer
          maxWidth="xl"
          padding
          className={animatedSectionClassName}
          style={{ animationDelay: "860ms" }}
        >
          <div className="mx-auto max-w-3xl space-y-8 text-center">
            <Text
              variant="h2"
              weight="bold"
              className="text-3xl font-black leading-tight text-text-primary md:text-5xl"
            >
              {t("landing.precision.title")}
            </Text>
            <Text variant="body-lg" className="text-text-secondary">
              {t("landing.precision.body")}
            </Text>
            <div className="grid grid-cols-1 gap-4 pt-4 text-left sm:grid-cols-2">
              <div className="rounded-2xl border border-border-default/30 bg-surface-secondary/50 px-10 py-5">
                <Text weight="semibold" className="mb-2 text-interactive-primary">
                  {t("landing.precision.qrTitle")}
                </Text>
                <Text variant="body-sm" className="text-text-secondary">
                  {t("landing.precision.qrBody")}
                </Text>
              </div>
              <div className="rounded-2xl border border-border-default/30 bg-surface-secondary/50 px-10 py-5">
                <Text weight="semibold" className="mb-2 text-interactive-secondary">
                  {t("landing.precision.kdsTitle")}
                </Text>
                <Text variant="body-sm" className="text-text-secondary">
                  {t("landing.precision.kdsBody")}
                </Text>
              </div>
            </div>
          </div>
        </ContentContainer>
      </section>

      <section className="px-4 py-20 md:py-28">
        <ContentContainer
          maxWidth="md"
          padding
          className={animatedSectionClassName}
          style={{ animationDelay: "1040ms" }}
        >
          <div className="text-center">
            <div className="mx-auto mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-interactive-primary/15 text-interactive-primary">
              <FaCode className="h-7 w-7" aria-hidden />
            </div>
            <Text variant="h2" weight="bold" className="mb-6 text-3xl font-black md:text-4xl">
              {t("landing.community.title")}
            </Text>
            <Text variant="body-lg" className="mb-10 text-text-secondary">
              {t("landing.community.body")}
            </Text>
            <div className="flex flex-wrap items-center justify-center gap-8 text-text-secondary">
              <a
                href="https://github.com/restorio-labs/restorio-fullstack"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-lg font-bold transition-colors hover:text-text-primary"
              >
                {t("landing.community.github")}
              </a>
              <a
                href="https://discord.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-lg font-bold transition-colors hover:text-text-primary"
              >
                {t("landing.community.discord")}
              </a>
              <a
                href="mailto:contact@restorio.org"
                className="flex items-center gap-2 text-lg font-bold transition-colors hover:text-text-primary"
              >
                {t("landing.community.contact")}
              </a>
            </div>
          </div>
        </ContentContainer>
      </section>

      <section id="landing-cta" className="scroll-mt-24 px-4 pb-24">
        <ContentContainer
          maxWidth="lg"
          padding
          className={animatedSectionClassName}
          style={{ animationDelay: "1220ms" }}
        >
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-interactive-primary/90 via-interactive-primary/70 to-surface-secondary px-8 py-12 text-center shadow-xl md:px-14 md:py-16">
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "radial-gradient(circle at 20% 20%, color-mix(in srgb, var(--color-text-inverse) 12%, transparent) 0%, transparent 45%)",
              }}
            />
            <div className="relative">
              <Text variant="h2" weight="bold" className="mb-4 text-2xl text-slate-900 dark:text-white md:text-3xl">
                {authStatus === "authenticated" ? t("landing.finalCta.loggedTitle") : t("landing.finalCta.title")}
              </Text>
              <Text variant="body-lg" className="mb-8 text-slate-900/80 dark:text-white/85">
                {authStatus === "authenticated" ? t("landing.finalCta.loggedSubtitle") : t("landing.finalCta.subtitle")}
              </Text>
              {authStatus === "anonymous" ? (
                <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                  <Link href={`/${locale}/register`}>
                    <Button
                      size="lg"
                      className="min-w-[200px] border-0 bg-background-inverse font-bold text-text-inverse hover:opacity-90 dark:bg-background-primary dark:text-text-primary dark:hover:bg-background-secondary"
                    >
                      {t("landing.finalCta.primary")}
                    </Button>
                  </Link>
                  <Link href={`/${locale}/about`}>
                    <Button
                      size="lg"
                      variant="primary"
                      className="min-w-[200px] border-0 bg-background-inverse font-bold text-text-inverse hover:opacity-90 dark:bg-background-primary dark:text-text-primary dark:hover:bg-background-secondary"
                    >
                      {t("landing.finalCta.secondary")}
                    </Button>
                  </Link>
                </div>
              ) : authStatus === "reconnecting" ? (
                <div className="flex flex-col items-center justify-center gap-3">
                  <Loader size="md" aria-hidden />
                  <span className="text-sm font-medium text-background-primary/90">{t("common.tryingToConnect")}</span>
                </div>
              ) : authStatus === "authenticated" ? (
                <Button
                  type="button"
                  size="lg"
                  className="min-w-[200px] border-0 bg-background-inverse font-bold text-text-inverse hover:opacity-90 dark:bg-background-primary dark:text-text-primary dark:hover:bg-background-secondary"
                  onClick={() => goToApp("admin-panel")}
                >
                  {t("chooseApp.labels.adminPanel")}
                </Button>
              ) : null}
              {authStatus === "anonymous" ? (
                <Text variant="body-sm" className="mt-6 text-background-primary/70">
                  {t("landing.finalCta.note")}
                </Text>
              ) : null}
            </div>
          </div>
        </ContentContainer>
      </section>
    </div>
  );
};
