import type { InvoiceData } from "@restorio/types";
import { Button, Checkbox, Input, useI18n } from "@restorio/ui";
import { type FormEvent, type ReactElement, useState } from "react";

interface CheckoutFormProps {
  totalAmount: number;
  disabled: boolean;
  isSubmitting: boolean;
  onSubmit: (email: string, note: string, invoiceData?: InvoiceData) => void;
}

const NIP_WEIGHTS = [6, 5, 7, 2, 3, 4, 5, 6, 7];

const validateNip = (nip: string): boolean => {
  const digitsOnly = nip.replace(/[\s-]/g, "");

  if (!/^\d{10}$/.test(digitsOnly)) {
    return false;
  }

  const digits = digitsOnly.split("").map(Number);
  let checksum = 0;

  for (let i = 0; i < 9; i++) {
    checksum += digits[i] * NIP_WEIGHTS[i];
  }

  checksum = checksum % 11;

  if (checksum === 10) {
    checksum = 0;
  }

  return digits[9] === checksum;
};

const validatePostalCode = (code: string): boolean => {
  return /^\d{2}-?\d{3}$/.test(code.trim());
};

export const CheckoutForm = ({ totalAmount, disabled, isSubmitting, onSubmit }: CheckoutFormProps): ReactElement => {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [emailError, setEmailError] = useState("");

  const [wantsInvoice, setWantsInvoice] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [nip, setNip] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");

  const [companyNameError, setCompanyNameError] = useState("");
  const [nipError, setNipError] = useState("");
  const [streetError, setStreetError] = useState("");
  const [cityError, setCityError] = useState("");
  const [postalCodeError, setPostalCodeError] = useState("");

  const validateEmail = (value: string): boolean => {
    if (!value.trim()) {
      setEmailError(t("checkout.emailRequired"));

      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setEmailError(t("checkout.emailInvalid"));

      return false;
    }
    setEmailError("");

    return true;
  };

  const validateInvoiceFields = (): boolean => {
    let isValid = true;

    if (!companyName.trim()) {
      setCompanyNameError(t("checkout.invoice.companyNameRequired"));
      isValid = false;
    } else {
      setCompanyNameError("");
    }

    if (!nip.trim()) {
      setNipError(t("checkout.invoice.nipRequired"));
      isValid = false;
    } else if (!validateNip(nip)) {
      setNipError(t("checkout.invoice.nipInvalid"));
      isValid = false;
    } else {
      setNipError("");
    }

    if (!street.trim()) {
      setStreetError(t("checkout.invoice.streetRequired"));
      isValid = false;
    } else {
      setStreetError("");
    }

    if (!city.trim()) {
      setCityError(t("checkout.invoice.cityRequired"));
      isValid = false;
    } else {
      setCityError("");
    }

    if (!postalCode.trim()) {
      setPostalCodeError(t("checkout.invoice.postalCodeRequired"));
      isValid = false;
    } else if (!validatePostalCode(postalCode)) {
      setPostalCodeError(t("checkout.invoice.postalCodeInvalid"));
      isValid = false;
    } else {
      setPostalCodeError("");
    }

    return isValid;
  };

  const handleSubmit = (e: FormEvent): void => {
    e.preventDefault();

    if (!validateEmail(email)) {
      return;
    }

    if (wantsInvoice && !validateInvoiceFields()) {
      return;
    }

    const invoiceData: InvoiceData | undefined = wantsInvoice
      ? {
          companyName: companyName.trim(),
          nip: nip.replace(/[\s-]/g, ""),
          street: street.trim(),
          city: city.trim(),
          postalCode: postalCode.trim().includes("-")
            ? postalCode.trim()
            : `${postalCode.trim().slice(0, 2)}-${postalCode.trim().slice(2)}`,
          country: "PL",
        }
      : undefined;

    onSubmit(email.trim(), note.trim(), invoiceData);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <Input
        label={t("checkout.emailLabel")}
        type="email"
        placeholder={t("checkout.emailPlaceholder")}
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);

          if (emailError) {
            validateEmail(e.target.value);
          }
        }}
        error={emailError}
        required
      />
      <Input
        label={t("checkout.noteLabel")}
        placeholder={t("checkout.notePlaceholder")}
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />

      <Checkbox
        label={t("checkout.invoice.wantInvoice")}
        checked={wantsInvoice}
        onChange={(e) => setWantsInvoice(e.target.checked)}
      />

      {wantsInvoice && (
        <div className="flex flex-col gap-3 rounded-lg border border-border-default bg-surface-secondary p-3">
          <Input
            label={t("checkout.invoice.companyNameLabel")}
            placeholder={t("checkout.invoice.companyNamePlaceholder")}
            value={companyName}
            onChange={(e) => {
              setCompanyName(e.target.value);

              if (companyNameError) {
                setCompanyNameError("");
              }
            }}
            error={companyNameError}
            required
          />
          <Input
            label={t("checkout.invoice.nipLabel")}
            placeholder={t("checkout.invoice.nipPlaceholder")}
            value={nip}
            onChange={(e) => {
              setNip(e.target.value);

              if (nipError) {
                setNipError("");
              }
            }}
            error={nipError}
            required
          />
          <Input
            label={t("checkout.invoice.streetLabel")}
            placeholder={t("checkout.invoice.streetPlaceholder")}
            value={street}
            onChange={(e) => {
              setStreet(e.target.value);

              if (streetError) {
                setStreetError("");
              }
            }}
            error={streetError}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label={t("checkout.invoice.postalCodeLabel")}
              placeholder={t("checkout.invoice.postalCodePlaceholder")}
              value={postalCode}
              onChange={(e) => {
                setPostalCode(e.target.value);

                if (postalCodeError) {
                  setPostalCodeError("");
                }
              }}
              error={postalCodeError}
              required
            />
            <Input
              label={t("checkout.invoice.cityLabel")}
              placeholder={t("checkout.invoice.cityPlaceholder")}
              value={city}
              onChange={(e) => {
                setCity(e.target.value);

                if (cityError) {
                  setCityError("");
                }
              }}
              error={cityError}
              required
            />
          </div>
        </div>
      )}

      <Button type="submit" variant="primary" size="lg" fullWidth disabled={disabled || isSubmitting} className="mt-2">
        {isSubmitting
          ? t("checkout.payProcessing")
          : t("checkout.payButton", { amount: totalAmount.toFixed(2), currency: t("common.currency") })}
      </Button>
    </form>
  );
};
