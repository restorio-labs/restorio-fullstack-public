"use client";

import { ContentContainer, Text } from "@restorio/ui";
import type { ReactElement } from "react";
import { FaUtensils } from "react-icons/fa6";
import {
  HiOutlineChartBar,
  HiOutlineClock,
  HiOutlineCreditCard,
  HiOutlineCubeTransparent,
  HiOutlineHandRaised,
  HiOutlineShieldCheck,
  HiOutlineUser,
  HiOutlineWallet,
} from "react-icons/hi2";

import { useTranslations } from "@/i18n/useT";

interface GoalCardProps {
  title: string;
  description: string;
  icon: ReactElement;
  variant?: "success" | "primary" | "warning" | "default";
}

const GoalCard = ({ title, description, icon, variant = "default" }: GoalCardProps): ReactElement => {
  const variantStyles = {
    success: "bg-interactive-success/10 text-interactive-success",
    primary: "bg-interactive-primary/10 text-interactive-primary",
    warning: "bg-text-warning/10 text-text-warning",
    default: "bg-text-primary/10 text-text-primary",
  };

  return (
    <div className="glass-card flex flex-col gap-6 rounded-xl border border-white/5 p-8 transition-transform duration-300 hover:-translate-y-2">
      <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-lg ${variantStyles[variant]}`}>
        {icon}
      </div>
      <div>
        <Text variant="h4" weight="bold" className="mb-2" align="center">
          {title}
        </Text>
        <Text variant="body-md" className="leading-relaxed text-text-secondary" align="center">
          {description}
        </Text>
      </div>
    </div>
  );
};

export const AboutContent = (): ReactElement => {
  const t = useTranslations();

  return (
    <div className="space-y-32 py-20 md:py-32">
      {/* Section 1: Our Mission (Hero Editorial) - Centered Focus */}
      <section className="relative px-6">
        <div className="pointer-events-none absolute top-1/2 left-1/2 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-interactive-primary/5 blur-[160px]" />
        <div className="mx-auto flex max-w-4xl flex-col items-center space-y-8 text-center">
          <Text variant="h1" className="text-glow text-5xl font-black leading-[1.1] tracking-tight md:text-8xl">
            {t("about.mission.title")}
          </Text>
          <Text
            variant="h3"
            className="text-2xl font-bold leading-relaxed text-interactive-primary md:text-4xl text-center"
          >
            {t("about.mission.subtitle")}
          </Text>
          <Text
            variant="body-lg"
            className="text-center text-lg font-medium leading-relaxed text-text-secondary md:text-xl"
          >
            {t("about.mission.description")}
          </Text>
        </div>
      </section>

      {/* Section 2: Why we do it (Problem) */}
      <ContentContainer fullWidth padding>
        <section className="space-y-12">
          <div className="space-y-4 text-center">
            <Text variant="h2" className="text-center text-4xl font-extrabold tracking-tight">
              {t("about.problem.title")}
            </Text>
            <div className="mx-auto h-1 w-24 rounded-full bg-text-warning" />
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div className="space-y-3 rounded-xl border-none bg-background-tertiary p-16 shadow-2xl">
              <HiOutlineClock className="text-6xl text-text-warning" />
              <Text variant="h3" className="text-2xl font-bold">
                {t("about.problem.manual.title")}
              </Text>
              <Text variant="body-md" className="leading-relaxed text-text-secondary">
                {t("about.problem.manual.description")}
              </Text>
            </div>
            <div className="space-y-6 rounded-xl border-none bg-background-tertiary p-16 shadow-2xl">
              <HiOutlineCreditCard className="text-6xl text-text-warning" />
              <Text variant="h3" className="text-2xl font-bold">
                {t("about.problem.cost.title")}
              </Text>
              <Text variant="body-md" className="leading-relaxed text-text-secondary">
                {t("about.problem.cost.description")}
              </Text>
            </div>
          </div>
        </section>
      </ContentContainer>

      {/* Section 3: Project Goals (Kinetic Cards) */}
      <ContentContainer fullWidth padding>
        <section className="space-y-12">
          <Text variant="h2" className="text-center text-4xl font-extrabold tracking-tight">
            {t("about.goals.title")}
          </Text>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <GoalCard
              title={t("about.goals.waiterless.title")}
              description={t("about.goals.waiterless.description")}
              icon={<HiOutlineHandRaised className="text-6xl" />}
              variant="success"
            />
            <GoalCard
              title={t("about.goals.multiLocation.title")}
              description={t("about.goals.multiLocation.description")}
              icon={<HiOutlineCubeTransparent className="text-6xl" />}
              variant="primary"
            />
            <GoalCard
              title={t("about.goals.secure.title")}
              description={t("about.goals.secure.description")}
              icon={<HiOutlineShieldCheck className="text-6xl" />}
              variant="warning"
            />
            <GoalCard
              title={t("about.goals.costEfficient.title")}
              description={t("about.goals.costEfficient.description")}
              icon={<HiOutlineWallet className="text-6xl" />}
            />
          </div>
        </section>
      </ContentContainer>

      {/* Section 4: Target Users (Asymmetric Depth) */}
      <ContentContainer maxWidth="lg" padding>
        <section className="space-y-16">
          <div className="mx-auto flex max-w-2xl flex-col items-center space-y-4 text-center">
            <Text variant="h2" className="text-center text-4xl font-extrabold tracking-tight md:text-5xl">
              {t("about.users.title")}
            </Text>
            <Text variant="body-lg" className="text-center font-medium text-text-secondary">
              {t("about.users.subtitle")}
            </Text>
          </div>
          <div className="grid grid-cols-1 items-stretch gap-8 lg:grid-cols-3">
            {/* Group 1 */}
            <div className="group relative">
              <div className="absolute inset-0 rounded-xl bg-interactive-primary/20 blur-2xl transition-all group-hover:bg-interactive-primary/40 group-hover:blur-3xl" />
              <div className="relative flex h-full flex-col items-center space-y-8 rounded-xl bg-surface-secondary p-12 text-center shadow-xl">
                <div className="h-24 w-24 overflow-hidden rounded-full border-2 border-interactive-primary/30 shadow-lg">
                  <img className="h-full w-full object-cover" alt="Restaurant owner" src="/images/about/owner.png" />
                </div>
                <div className="flex-1 space-y-4">
                  <Text variant="h4" className="font-bold uppercase tracking-widest text-interactive-primary">
                    {t("about.users.owners.title")}
                  </Text>
                  <Text variant="caption" className="mx-auto max-w-xs leading-relaxed text-text-secondary">
                    {t("about.users.owners.description")}
                  </Text>
                </div>
                <div className="flex h-12 items-center justify-center">
                  <HiOutlineChartBar className="text-5xl text-interactive-primary" />
                </div>
              </div>
            </div>
            {/* Group 2 */}
            <div className="group relative">
              <div className="absolute inset-0 rounded-xl bg-interactive-success/20 blur-2xl transition-all group-hover:bg-interactive-success/40 group-hover:blur-3xl" />
              <div className="relative flex h-full flex-col items-center space-y-8 rounded-xl bg-surface-secondary p-12 text-center shadow-xl">
                <div className="h-24 w-24 overflow-hidden rounded-full border-2 border-interactive-success/30 shadow-lg">
                  <img className="h-full w-full object-cover" alt="Chef working" src="/images/about/kitchen.png" />
                </div>
                <div className="flex-1 space-y-4">
                  <Text variant="h4" className="font-bold uppercase tracking-widest text-interactive-success">
                    {t("about.users.staff.title")}
                  </Text>
                  <Text variant="caption" className="mx-auto max-w-xs leading-relaxed text-text-secondary">
                    {t("about.users.staff.description")}
                  </Text>
                </div>
                <div className="flex h-12 items-center justify-center">
                  <FaUtensils className="text-5xl text-interactive-success" />
                </div>
              </div>
            </div>
            {/* Group 3 */}
            <div className="group relative">
              <div className="absolute inset-0 rounded-xl bg-text-warning/20 blur-2xl transition-all group-hover:bg-text-warning/40 group-hover:blur-3xl" />
              <div className="relative flex h-full flex-col items-center space-y-8 rounded-xl bg-surface-secondary p-12 text-center shadow-xl">
                <div className="h-24 w-24 overflow-hidden rounded-full border-2 border-text-warning/30 shadow-lg">
                  <img
                    className="h-full w-full object-cover"
                    alt="Customer using smartphone"
                    src="/images/about/customer.png"
                  />
                </div>
                <div className="flex-1 space-y-4">
                  <Text variant="h4" className="font-bold uppercase tracking-widest text-text-warning">
                    {t("about.users.customers.title")}
                  </Text>
                  <Text variant="caption" className="mx-auto max-w-xs leading-relaxed text-text-secondary">
                    {t("about.users.customers.description")}
                  </Text>
                </div>
                <div className="flex h-12 items-center justify-center">
                  <HiOutlineUser className="text-5xl text-text-warning" />
                </div>
              </div>
            </div>
          </div>
        </section>
      </ContentContainer>
    </div>
  );
};
