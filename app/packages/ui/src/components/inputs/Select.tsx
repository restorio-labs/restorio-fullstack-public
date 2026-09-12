import { forwardRef, useId } from "react";

import { cn } from "../../utils";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: SelectOption[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, helperText, options, placeholder, id, className, ...props }, ref) => {
    const generatedId = useId();
    const selectId = id ?? generatedId;
    const errorId = `${selectId}-error`;
    const helperId = `${selectId}-helper`;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={selectId} className="block text-sm font-medium text-text-primary mb-1">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={cn(
            "w-full px-4 py-2 text-base text-text-primary bg-surface-primary border border-border-default rounded-input",
            "focus:outline-none focus:ring-2 focus:ring-border-focus focus:border-border-focus",
            "disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-surface-secondary",
            "appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22currentColor%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22%3E%3Cpolyline points=%226 9 12 15 18 9%22%3E%3C/polyline%3E%3C/svg%3E')] bg-no-repeat bg-[length:1.5em] bg-[right_0.5em_center] rtl:bg-[left_0.5em_center] pe-10 ps-4",
            error && "border-status-error-border focus:ring-status-error-border focus:border-status-error-border",
            className,
          )}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={(error ? errorId : undefined) ?? helperId}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>
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

Select.displayName = "Select";
