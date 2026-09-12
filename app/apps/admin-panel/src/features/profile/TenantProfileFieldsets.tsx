import type { ProfileFormData } from "@restorio/types";
import { Input } from "@restorio/ui";
import type { ChangeEventHandler, ReactNode, ReactElement } from "react";
import type { UseFormRegister } from "react-hook-form";

import { FilePickerField } from "../../components/file-picker";

interface BaseFieldsetProps {
  children: ReactNode;
  title: string;
}

interface FormFieldsetProps {
  getFieldError: (field: string) => string | undefined;
  register: UseFormRegister<ProfileFormData>;
  t: (key: string) => string;
}

interface CompanyFieldsetProps extends FormFieldsetProps {
  effectiveLogo?: string | null;
  handleLogoChange?: ChangeEventHandler<HTMLInputElement>;
  isSaving?: boolean;
  logoFieldError: string | undefined;
  showLogoField?: boolean;
}

const FieldsetCard = ({ children, title }: BaseFieldsetProps): ReactElement => {
  return (
    <fieldset className="h-fit rounded-xl border border-border-default bg-surface-secondary/60 p-4 shadow-sm p-6">
      <legend className="mb-0 text-sm font-semibold text-text-primary">{title}</legend>
      <div className="space-y-4">{children}</div>
    </fieldset>
  );
};

export const CompanyFieldset = ({
  effectiveLogo = null,
  getFieldError,
  handleLogoChange,
  isSaving = false,
  logoFieldError,
  register,
  showLogoField = true,
  t,
}: CompanyFieldsetProps): ReactElement => {
  const handleLogoChangeSafe: ChangeEventHandler<HTMLInputElement> = (event) => {
    handleLogoChange?.(event);
  };

  return (
    <FieldsetCard title={t("tenantProfile.sections.company")}>
      <Input
        label={t("tenantProfile.fields.nip.label")}
        placeholder={t("tenantProfile.fields.nip.placeholder")}
        maxLength={10}
        labelTooltip={t("tenantProfile.fields.nip.helper")}
        error={getFieldError("nip")}
        {...register("nip", { required: true, pattern: /^\d{10}$/ })}
      />
      <Input
        label={t("tenantProfile.fields.companyName.label")}
        placeholder={t("tenantProfile.fields.companyName.placeholder")}
        maxLength={255}
        error={getFieldError("companyName")}
        {...register("companyName", { required: true })}
      />
      {showLogoField ? (
        <>
          <FilePickerField
            label={t("tenantProfile.fields.logo.label")}
            labelTooltip={t("tenantProfile.fields.logo.helper")}
            accept="image/png,image/jpeg,image/webp"
            onChange={handleLogoChangeSafe}
            disabled={isSaving}
            busy={isSaving}
            idleLabel={t("tenantProfile.fields.logo.browse")}
            busyLabel={t("tenantProfile.fields.logo.uploading")}
            error={logoFieldError}
          />
          {effectiveLogo ? (
            <div className="space-y-2 rounded-lg border border-border-default bg-surface-primary p-3">
              <div className="text-xs text-text-secondary">{t("tenantProfile.fields.logo.current")}</div>
              <img
                src={effectiveLogo}
                alt={t("tenantProfile.fields.logo.previewAlt")}
                className="h-20 w-20 rounded-lg border border-border-default bg-surface-secondary object-contain"
              />
            </div>
          ) : null}
        </>
      ) : null}
    </FieldsetCard>
  );
};

export const ContactFieldset = ({ getFieldError, register, t }: FormFieldsetProps): ReactElement => {
  return (
    <FieldsetCard title={t("tenantProfile.sections.contact")}>
      <Input
        label={t("tenantProfile.fields.contactEmail.label")}
        type="email"
        placeholder={t("tenantProfile.fields.contactEmail.placeholder")}
        maxLength={255}
        error={getFieldError("contactEmail")}
        {...register("contactEmail", { required: true })}
      />
      <Input
        label={t("tenantProfile.fields.phone.label")}
        type="tel"
        placeholder={t("tenantProfile.fields.phone.placeholder")}
        maxLength={20}
        error={getFieldError("phone")}
        {...register("phone", { required: true })}
      />
    </FieldsetCard>
  );
};

export const AddressFieldset = ({ getFieldError, register, t }: FormFieldsetProps): ReactElement => {
  return (
    <FieldsetCard title={t("tenantProfile.sections.address")}>
      <Input
        label={t("tenantProfile.fields.addressStreetName.label")}
        placeholder={t("tenantProfile.fields.addressStreetName.placeholder")}
        maxLength={255}
        error={getFieldError("addressStreetName")}
        {...register("addressStreetName", { required: true })}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label={t("tenantProfile.fields.addressStreetNumber.label")}
          placeholder={t("tenantProfile.fields.addressStreetNumber.placeholder")}
          maxLength={20}
          error={getFieldError("addressStreetNumber")}
          {...register("addressStreetNumber", { required: true })}
        />
        <Input
          label={t("tenantProfile.fields.addressCity.label")}
          placeholder={t("tenantProfile.fields.addressCity.placeholder")}
          maxLength={100}
          error={getFieldError("addressCity")}
          {...register("addressCity", { required: true })}
        />
        <Input
          label={t("tenantProfile.fields.addressPostalCode.label")}
          placeholder={t("tenantProfile.fields.addressPostalCode.placeholder")}
          maxLength={6}
          helperText={t("tenantProfile.fields.addressPostalCode.helper")}
          error={getFieldError("addressPostalCode")}
          {...register("addressPostalCode", { required: true, pattern: /^\d{2}-\d{3}$/ })}
        />
      </div>
      <Input
        label={t("tenantProfile.fields.addressCountry.label")}
        placeholder={t("tenantProfile.fields.addressCountry.placeholder")}
        maxLength={100}
        error={getFieldError("addressCountry")}
        {...register("addressCountry")}
      />
    </FieldsetCard>
  );
};

export const OwnerFieldset = ({ getFieldError, register, t }: FormFieldsetProps): ReactElement => {
  return (
    <FieldsetCard title={t("tenantProfile.sections.owner")}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label={t("tenantProfile.fields.ownerFirstName.label")}
          placeholder={t("tenantProfile.fields.ownerFirstName.placeholder")}
          maxLength={100}
          error={getFieldError("ownerFirstName")}
          {...register("ownerFirstName", { required: true })}
        />
        <Input
          label={t("tenantProfile.fields.ownerLastName.label")}
          placeholder={t("tenantProfile.fields.ownerLastName.placeholder")}
          maxLength={100}
          error={getFieldError("ownerLastName")}
          {...register("ownerLastName", { required: true })}
        />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label={t("tenantProfile.fields.ownerEmail.label")}
          type="email"
          placeholder={t("tenantProfile.fields.ownerEmail.placeholder")}
          maxLength={255}
          error={getFieldError("ownerEmail")}
          {...register("ownerEmail")}
        />
        <Input
          label={t("tenantProfile.fields.ownerPhone.label")}
          type="tel"
          placeholder={t("tenantProfile.fields.ownerPhone.placeholder")}
          maxLength={20}
          error={getFieldError("ownerPhone")}
          {...register("ownerPhone")}
        />
      </div>
    </FieldsetCard>
  );
};

export const ContactPersonFieldset = ({ getFieldError, register, t }: FormFieldsetProps): ReactElement => {
  return (
    <FieldsetCard title={t("tenantProfile.sections.contactPerson")}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label={t("tenantProfile.fields.contactPersonFirstName.label")}
          placeholder={t("tenantProfile.fields.contactPersonFirstName.placeholder")}
          maxLength={100}
          error={getFieldError("contactPersonFirstName")}
          {...register("contactPersonFirstName")}
        />
        <Input
          label={t("tenantProfile.fields.contactPersonLastName.label")}
          placeholder={t("tenantProfile.fields.contactPersonLastName.placeholder")}
          maxLength={100}
          error={getFieldError("contactPersonLastName")}
          {...register("contactPersonLastName")}
        />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label={t("tenantProfile.fields.contactPersonEmail.label")}
          type="email"
          placeholder={t("tenantProfile.fields.contactPersonEmail.placeholder")}
          maxLength={255}
          error={getFieldError("contactPersonEmail")}
          {...register("contactPersonEmail")}
        />
        <Input
          label={t("tenantProfile.fields.contactPersonPhone.label")}
          type="tel"
          placeholder={t("tenantProfile.fields.contactPersonPhone.placeholder")}
          maxLength={20}
          error={getFieldError("contactPersonPhone")}
          {...register("contactPersonPhone")}
        />
      </div>
    </FieldsetCard>
  );
};

export const SocialsFieldset = ({ getFieldError, register, t }: FormFieldsetProps): ReactElement => {
  return (
    <FieldsetCard title={t("tenantProfile.sections.socials")}>
      <Input
        label={t("tenantProfile.fields.socialFacebook.label")}
        placeholder={t("tenantProfile.fields.socialFacebook.placeholder")}
        maxLength={512}
        error={getFieldError("socialFacebook")}
        {...register("socialFacebook")}
      />
      <Input
        label={t("tenantProfile.fields.socialInstagram.label")}
        placeholder={t("tenantProfile.fields.socialInstagram.placeholder")}
        maxLength={512}
        error={getFieldError("socialInstagram")}
        {...register("socialInstagram")}
      />
      <Input
        label={t("tenantProfile.fields.socialTiktok.label")}
        placeholder={t("tenantProfile.fields.socialTiktok.placeholder")}
        maxLength={512}
        error={getFieldError("socialTiktok")}
        {...register("socialTiktok")}
      />
      <Input
        label={t("tenantProfile.fields.socialWebsite.label")}
        placeholder={t("tenantProfile.fields.socialWebsite.placeholder")}
        maxLength={512}
        error={getFieldError("socialWebsite")}
        {...register("socialWebsite")}
      />
    </FieldsetCard>
  );
};
