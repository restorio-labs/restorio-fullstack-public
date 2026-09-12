import type { TenantSummary } from "@restorio/types";
import { Button, Form, FormActions, Input, useI18n } from "@restorio/ui";
import { slugify } from "@restorio/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { FormEvent, ReactElement } from "react";
import { useForm } from "react-hook-form";

import { api } from "../api/client";
import { tenantDetailsQueryKey, useCurrentTenant } from "../context/TenantContext";
import { tenantsQueryKey } from "../hooks/useTenants";

interface OnboardingFormValues {
  name: string;
  addressStreetName: string;
  addressStreetNumber: string;
  addressCity: string;
}

export const OnboardingPage = (): ReactElement => {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const { setSelectedTenantId, refreshTenants } = useCurrentTenant();

  const {
    register,
    handleSubmit,
    watch,
    formState: { isValid, errors },
  } = useForm<OnboardingFormValues>({
    defaultValues: {
      name: "",
      addressStreetName: "",
      addressStreetNumber: "",
      addressCity: "",
    },
    mode: "onChange",
  });

  const watchedName = watch("name");
  const watchedStreet = watch("addressStreetName");
  const watchedNumber = watch("addressStreetNumber");
  const watchedCity = watch("addressCity");
  const generatedSlug = slugify(`${watchedName}-${watchedStreet}-${watchedNumber}-${watchedCity}`);

  const createMutation = useMutation({
    mutationFn: async (values: OnboardingFormValues) => {
      const createdTenant = await api.tenants.create({
        name: values.name.trim(),
        slug: generatedSlug,
        status: "active",
      });

      return createdTenant;
    },
    onSuccess: async (createdTenant) => {
      const createdSummary: TenantSummary = {
        ...createdTenant,
        floorCanvasCount: createdTenant.floorCanvases.length,
      };

      queryClient.setQueryData<TenantSummary[]>(tenantsQueryKey, (current = []) => {
        const filtered = current.filter((tenant) => tenant.id !== createdSummary.id);

        return [createdSummary, ...filtered];
      });
      void queryClient.invalidateQueries({ queryKey: tenantDetailsQueryKey(createdTenant.id) });

      setSelectedTenantId(createdTenant.id);

      try {
        await api.auth.refresh();
      } catch {
        // Tenant creation already rotates auth cookies on backend.
      }

      refreshTenants();
      window.location.replace("/");
    },
  });

  const onSubmit = (values: OnboardingFormValues): void => {
    createMutation.mutate(values);
  };

  const isFormDisabled = !isValid || !generatedSlug || createMutation.isPending;
  const animatedFieldClassName = "onboarding-fade-up motion-reduce:animate-none";

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-surface-secondary p-4 onboarding-fade-in motion-reduce:animate-none">
      <div
        className="w-full max-w-2xl rounded-lg bg-surface-primary p-8 shadow-lg onboarding-fade-up motion-reduce:animate-none"
        style={{ animationDelay: "80ms" }}
      >
        <h1 className="mb-2 text-2xl font-bold text-text-primary">{t("onboarding.title")}</h1>
        <p className="mb-8 text-text-secondary">{t("onboarding.description")}</p>

        <Form
          id="onboarding-form"
          onSubmit={(event: FormEvent<HTMLFormElement>): void => {
            void handleSubmit(onSubmit)(event);
          }}
        >
          <div className={animatedFieldClassName} style={{ animationDelay: "160ms" }}>
            <Input
              label={t("onboarding.fields.name.label")}
              placeholder={t("onboarding.fields.name.placeholder")}
              error={errors.name ? t("onboarding.fields.name.error") : undefined}
              maxLength={255}
              {...register("name", {
                required: true,
                minLength: 1,
                maxLength: 255,
                validate: (value) => slugify(value).length > 0,
              })}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mt-4">
            <div className={animatedFieldClassName} style={{ animationDelay: "240ms" }}>
              <Input
                label={t("onboarding.fields.street.label")}
                placeholder={t("onboarding.fields.street.placeholder")}
                maxLength={255}
                error={errors.addressStreetName ? t("onboarding.fields.street.error") : undefined}
                {...register("addressStreetName", { required: true })}
              />
            </div>
            <div className={animatedFieldClassName} style={{ animationDelay: "320ms" }}>
              <Input
                label={t("onboarding.fields.streetNumber.label")}
                placeholder={t("onboarding.fields.streetNumber.placeholder")}
                maxLength={20}
                error={errors.addressStreetNumber ? t("onboarding.fields.streetNumber.error") : undefined}
                {...register("addressStreetNumber", { required: true })}
              />
            </div>
            <div className={animatedFieldClassName} style={{ animationDelay: "400ms" }}>
              <Input
                label={t("onboarding.fields.city.label")}
                placeholder={t("onboarding.fields.city.placeholder")}
                maxLength={100}
                error={errors.addressCity ? t("onboarding.fields.city.error") : undefined}
                {...register("addressCity", { required: true })}
              />
            </div>
          </div>

          {createMutation.isError && (
            <div className="mt-4 rounded-lg border border-status-error-border bg-status-error-background px-4 py-3 text-sm text-status-error-text">
              {t("onboarding.errors.createFailed")}
            </div>
          )}

          <div className="mt-8 onboarding-fade-up motion-reduce:animate-none" style={{ animationDelay: "480ms" }}>
            <FormActions align="stretch">
              <Button type="submit" size="lg" variant="primary" fullWidth disabled={isFormDisabled}>
                {createMutation.isPending ? t("onboarding.actions.creating") : t("onboarding.actions.create")}
              </Button>
            </FormActions>
          </div>
        </Form>
      </div>
    </div>
  );
};
