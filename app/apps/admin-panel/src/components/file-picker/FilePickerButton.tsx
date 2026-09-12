import { cn } from "@restorio/ui";
import type { ChangeEventHandler, ReactElement } from "react";

export interface FilePickerButtonProps {
  accept: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
  disabled?: boolean;
  busy?: boolean;
  idleLabel: string;
  busyLabel: string;
  id?: string;
  className?: string;
  ariaDescribedBy?: string;
  ariaInvalid?: boolean | "true" | "false";
}

export const FilePickerButton = ({
  accept,
  onChange,
  disabled = false,
  busy = false,
  idleLabel,
  busyLabel,
  id,
  className,
  ariaDescribedBy,
  ariaInvalid,
}: FilePickerButtonProps): ReactElement => {
  const isDisabled = disabled || busy;

  return (
    <label
      className={cn(
        "inline-flex cursor-pointer items-center justify-center rounded-md border border-border-default bg-surface-primary px-3 py-2 text-xs font-medium text-text-primary",
        isDisabled && "cursor-not-allowed opacity-50",
        className,
      )}
    >
      <input
        id={id}
        type="file"
        accept={accept}
        className="sr-only"
        disabled={isDisabled}
        onChange={onChange}
        aria-describedby={ariaDescribedBy}
        aria-invalid={ariaInvalid}
      />
      {busy ? busyLabel : idleLabel}
    </label>
  );
};
