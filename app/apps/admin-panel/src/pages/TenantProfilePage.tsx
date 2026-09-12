import type { ProfileFormData } from "@restorio/types";
import { Button, Form, FormActions, useI18n, Loader } from "@restorio/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ChangeEvent, FormEvent, ReactElement } from "react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { api } from "../api/client";
import { useCurrentTenant } from "../context/TenantContext";
import { EMPTY_FORM, toFormData } from "../features/profile/profileForm";
import {
  AddressFieldset,
  CompanyFieldset,
  ContactFieldset,
  ContactPersonFieldset,
  OwnerFieldset,
  SocialsFieldset,
} from "../features/profile/TenantProfileFieldsets";
import { useValidationErrors } from "../hooks/useValidationErrors";
import { PageLayout } from "../layouts/PageLayout";

const profileQueryKey = (tenantId: string): readonly string[] => ["tenant-profile", tenantId];
const MAX_LOGO_BYTES = 5 * 1024 * 1024;
const ALLOWED_LOGO_TYPES = ["image/png", "image/jpeg", "image/webp"];

export const TenantProfilePage = (): ReactElement => {
  const { t } = useI18n();
  const { selectedTenant } = useCurrentTenant();
  const queryClient = useQueryClient();
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error" | "validation">("idle");
  const [logoUploadError, setLogoUploadError] = useState("");
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [logoViewUrl, setLogoViewUrl] = useState<string | null>(null);
  const [selectedLogoFile, setSelectedLogoFile] = useState<File | null>(null);
  const { getFieldError, setFromResponse, clearErrors } = useValidationErrors();

  const tenantId = selectedTenant?.id ?? null;

  const { data: profile, isLoading: isLoadingProfile } = useQuery({
    queryKey: profileQueryKey(tenantId ?? ""),
    queryFn: () => api.tenantProfiles.get(tenantId!),
    enabled: tenantId !== null,
  });

  const {
    register,
    handleSubmit,
    formState: { isValid },
    reset,
  } = useForm<ProfileFormData>({
    defaultValues: EMPTY_FORM,
    mode: "onChange",
  });

  useEffect(() => {
    if (profile) {
      reset(toFormData(profile));
    } else {
      reset(EMPTY_FORM);
    }

    setSubmitStatus("idle");
    setLogoUploadError("");
    setLogoPreviewUrl(null);
    setLogoViewUrl(null);
    setSelectedLogoFile(null);
    clearErrors();
  }, [profile, reset, clearErrors]);

  useEffect(() => {
    if (!tenantId || !profile?.logo) {
      setLogoViewUrl(null);

      return;
    }

    void (async (): Promise<void> => {
      try {
        const result = await api.tenantProfiles.createLogoViewUrl(tenantId);

        setLogoViewUrl(result.url);
      } catch {
        setLogoViewUrl(null);
      }
    })();
  }, [tenantId, profile?.logo]);

  useEffect(() => {
    return () => {
      if (logoPreviewUrl) {
        URL.revokeObjectURL(logoPreviewUrl);
      }
    };
  }, [logoPreviewUrl]);

  const saveMutation = useMutation({
    mutationFn: async (values: ProfileFormData) => {
      if (!tenantId) {
        throw new Error("No tenant selected");
      }

      let logoUploadKey: string | null = null;

      if (selectedLogoFile) {
        const uploadTarget = await api.tenantProfiles.createLogoUploadUrl(tenantId, {
          contentType: selectedLogoFile.type,
          fileName: selectedLogoFile.name,
        });

        const uploadResult = await fetch(uploadTarget.uploadUrl, {
          method: "PUT",
          headers: {
            "Content-Type": selectedLogoFile.type,
          },
          body: selectedLogoFile,
        });

        if (!uploadResult.ok) {
          throw new Error("Logo upload failed");
        }

        logoUploadKey = uploadTarget.objectKey;
      }

      return api.tenantProfiles.save(tenantId, {
        nip: values.nip.trim(),
        company_name: values.companyName.trim(),
        logo_upload_key: logoUploadKey,
        contact_email: values.contactEmail.trim(),
        phone: values.phone.trim(),
        address_street_name: values.addressStreetName.trim(),
        address_street_number: values.addressStreetNumber.trim(),
        address_city: values.addressCity.trim(),
        address_postal_code: values.addressPostalCode.trim(),
        address_country: values.addressCountry.trim() || "Polska",
        owner_first_name: values.ownerFirstName.trim(),
        owner_last_name: values.ownerLastName.trim(),
        owner_email: values.ownerEmail.trim() || null,
        owner_phone: values.ownerPhone.trim() || null,
        contact_person_first_name: values.contactPersonFirstName.trim() || null,
        contact_person_last_name: values.contactPersonLastName.trim() || null,
        contact_person_email: values.contactPersonEmail.trim() || null,
        contact_person_phone: values.contactPersonPhone.trim() || null,
        social_facebook: values.socialFacebook.trim() || null,
        social_instagram: values.socialInstagram.trim() || null,
        social_tiktok: values.socialTiktok.trim() || null,
        social_website: values.socialWebsite.trim() || null,
      });
    },
    onSuccess: (_savedProfile) => {
      setSubmitStatus("success");
      setLogoUploadError("");
      setSelectedLogoFile(null);

      if (logoPreviewUrl) {
        URL.revokeObjectURL(logoPreviewUrl);
      }

      setLogoPreviewUrl(null);
      setLogoViewUrl(null);

      if (tenantId) {
        void queryClient.invalidateQueries({ queryKey: profileQueryKey(tenantId) });
      }
    },
    onError: (err: unknown) => {
      if (selectedLogoFile && logoUploadError === "") {
        setLogoUploadError(t("tenantProfile.fields.logo.uploadError"));
      }

      const isValidation = setFromResponse(err, "tenantProfile.fields");

      setSubmitStatus(isValidation ? "validation" : "error");
    },
  });

  const onSubmit = (values: ProfileFormData): void => {
    setSubmitStatus("idle");
    setLogoUploadError("");
    clearErrors();
    saveMutation.mutate(values);
  };

  const handleLogoChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0];

    setLogoUploadError("");

    if (!file) {
      return;
    }

    if (!ALLOWED_LOGO_TYPES.includes(file.type)) {
      setLogoUploadError(t("tenantProfile.fields.logo.invalidType"));
      event.target.value = "";

      return;
    }

    if (file.size > MAX_LOGO_BYTES) {
      setLogoUploadError(t("tenantProfile.fields.logo.fileTooLarge"));
      event.target.value = "";

      return;
    }

    setSelectedLogoFile(file);
    setLogoPreviewUrl((currentPreviewUrl) => {
      if (currentPreviewUrl) {
        URL.revokeObjectURL(currentPreviewUrl);
      }

      return URL.createObjectURL(file);
    });
    event.target.value = "";
  };

  const effectiveLogo = logoPreviewUrl ?? logoViewUrl ?? null;
  const logoFieldError = logoUploadError || getFieldError("logo");
  const isFormDisabled = !tenantId || !isValid || isLoadingProfile || saveMutation.isPending;

  return (
    <PageLayout
      title={t("tenantProfile.title")}
      description={t("tenantProfile.description")}
      headerActions={
        <FormActions>
          <Button type="submit" form="tenant-profile-form" disabled={isFormDisabled}>
            {saveMutation.isPending ? t("tenantProfile.actions.saving") : t("tenantProfile.actions.save")}
          </Button>
        </FormActions>
      }
    >
      <div className="mx-auto max-w-5xl p-6">
        <Form
          id="tenant-profile-form"
          onSubmit={(event: FormEvent<HTMLFormElement>): void => {
            void handleSubmit(onSubmit)(event);
          }}
        >
          {isLoadingProfile && (
            <div className="flex items-center gap-2 mb-4 text-xs text-text-tertiary">
              <Loader size="sm" />
              <span>{t("tenantProfile.loadingProfile")}</span>
            </div>
          )}
          {submitStatus === "error" && (
            <div className="text-xs text-status-error-text">{t("tenantProfile.errors.saveFailed")}</div>
          )}
          {submitStatus === "validation" && (
            <div className="text-xs text-status-error-text">{t("tenantProfile.errors.validationFailed")}</div>
          )}

          <div className="mt-2 grid items-start gap-6 [grid-template-columns:repeat(auto-fit,minmax(320px,1fr))]">
            <CompanyFieldset
              effectiveLogo={effectiveLogo}
              getFieldError={getFieldError}
              handleLogoChange={handleLogoChange}
              isSaving={saveMutation.isPending}
              logoFieldError={logoFieldError}
              register={register}
              t={t}
            />
            <ContactFieldset getFieldError={getFieldError} register={register} t={t} />
            <AddressFieldset getFieldError={getFieldError} register={register} t={t} />
            <OwnerFieldset getFieldError={getFieldError} register={register} t={t} />
            <ContactPersonFieldset getFieldError={getFieldError} register={register} t={t} />
            <SocialsFieldset getFieldError={getFieldError} register={register} t={t} />
          </div>

          {submitStatus === "success" && (
            <div className="rounded-lg border border-status-success-border bg-status-success-background px-4 py-3 text-sm text-status-success-text">
              {t("tenantProfile.success")}
            </div>
          )}
        </Form>
      </div>
    </PageLayout>
  );
};
