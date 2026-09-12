import { cn, Tooltip } from "@restorio/ui";
import type { ChangeEventHandler, ComponentType, ReactElement, SVGProps } from "react";
import { useId } from "react";
import { BsQuestion } from "react-icons/bs";

import { FilePickerButton } from "./FilePickerButton";

const QuestionMarkIcon = BsQuestion as ComponentType<SVGProps<SVGSVGElement>>;

export interface FilePickerFieldProps {
  label: string;
  labelTooltip?: string;
  error?: string;
  helperText?: string;
  accept: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
  disabled?: boolean;
  busy?: boolean;
  idleLabel: string;
  busyLabel: string;
  id?: string;
  className?: string;
  labelClassName?: string;
  buttonClassName?: string;
}

export const FilePickerField = ({
  label,
  labelTooltip,
  error,
  helperText,
  accept,
  onChange,
  disabled = false,
  busy = false,
  idleLabel,
  busyLabel,
  id,
  className,
  labelClassName,
  buttonClassName,
}: FilePickerFieldProps): ReactElement => {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const errorId = `${fieldId}-error`;
  const helperId = `${fieldId}-helper`;
  const describedBy = [error ? errorId : undefined, helperText && !error ? helperId : undefined]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={cn("mt-0 w-full", className)}>
      <div className="mb-1 flex w-full items-center gap-2">
        <label
          htmlFor={fieldId}
          className={cn("min-w-0 text-sm font-medium leading-5 text-text-primary", labelClassName)}
        >
          {label}
        </label>
        {labelTooltip ? (
          <span className="inline-flex shrink-0">
            <Tooltip
              content={labelTooltip}
              className="w-max min-w-0 max-w-[min(100vw-2rem,22rem)] whitespace-normal px-3 py-2 text-left text-sm leading-relaxed"
            >
              <button
                type="button"
                className="inline-flex size-5 shrink-0 items-center justify-center self-center rounded-full border border-border-default/90 bg-surface-secondary/40 text-[11px] font-semibold leading-none text-text-secondary transition-colors hover:border-border-focus hover:bg-surface-secondary hover:text-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-1"
                aria-label={labelTooltip}
              >
                <QuestionMarkIcon className="size-3.5" aria-hidden />
              </button>
            </Tooltip>
          </span>
        ) : null}
      </div>
      <FilePickerButton
        id={fieldId}
        accept={accept}
        onChange={onChange}
        disabled={disabled}
        busy={busy}
        idleLabel={idleLabel}
        busyLabel={busyLabel}
        className={buttonClassName}
        ariaDescribedBy={describedBy || undefined}
        ariaInvalid={error ? "true" : undefined}
      />
      {error ? (
        <span id={errorId} className="mt-1 block text-sm text-status-error-text" role="alert">
          {error}
        </span>
      ) : null}
      {helperText && !error ? (
        <span id={helperId} className="mt-1 block text-sm text-text-secondary">
          {helperText}
        </span>
      ) : null}
    </div>
  );
};
