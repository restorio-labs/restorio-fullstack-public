import { forwardRef, useId, type ComponentType, type ReactElement, type ReactNode, type SVGProps } from "react";
import { BsQuestion } from "react-icons/bs";

import { cn } from "../../utils";
import { Tooltip } from "../overlays/Tooltip";

const QuestionMarkIcon = BsQuestion as ComponentType<SVGProps<SVGSVGElement>>;

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  labelTooltip?: string;
  endAdornment?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, labelTooltip, id, className, endAdornment, ...props }, ref): ReactElement => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;
    const describedBy = [error ? errorId : undefined, helperText && !error ? helperId : undefined]
      .filter(Boolean)
      .join(" ");

    return (
      <div className="w-full mt-0">
        {label && (
          <div className="mb-1 flex w-full items-center gap-1">
            <label htmlFor={inputId} className="min-w-0 text-sm font-medium leading-5 text-text-primary">
              {label}
            </label>
            {labelTooltip ? (
              <span className="inline-flex shrink-0">
                <Tooltip
                  content={labelTooltip}
                  className="w-max min-w-0 max-w-[min(100vw-2rem,22rem)] px-3 py-2 text-left text-sm leading-relaxed whitespace-normal"
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
        )}
        {endAdornment ? (
          <div className="relative">
            <input
              ref={ref}
              id={inputId}
              className={cn(
                "w-full px-4 py-2 pr-11 text-base text-text-primary bg-surface-primary border border-border-default rounded-input",
                "placeholder:text-text-tertiary",
                "focus:outline-none focus:ring-2 focus:ring-border-focus focus:border-border-focus",
                "disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-surface-secondary",
                error && "border-status-error-border focus:ring-status-error-border focus:border-status-error-border",
                className,
              )}
              aria-invalid={error ? "true" : undefined}
              aria-describedby={describedBy || undefined}
              {...props}
            />
            <div className="absolute right-2 top-1/2 z-[1] -translate-y-1/2 text-text-secondary">{endAdornment}</div>
          </div>
        ) : (
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "w-full px-4 py-2 text-base text-text-primary bg-surface-primary border border-border-default rounded-input",
              "placeholder:text-text-tertiary",
              "focus:outline-none focus:ring-2 focus:ring-border-focus focus:border-border-focus",
              "disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-surface-secondary",
              error && "border-status-error-border focus:ring-status-error-border focus:border-status-error-border",
              className,
            )}
            aria-invalid={error ? "true" : undefined}
            aria-describedby={describedBy || undefined}
            {...props}
          />
        )}
        {error && (
          <span id={errorId} className="block mt-1 text-sm text-status-error-text" role="alert">
            {error}
          </span>
        )}
        {helperText && !error && (
          <span id={helperId} className="block mt-1 text-sm text-text-secondary">
            {helperText}
          </span>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";
