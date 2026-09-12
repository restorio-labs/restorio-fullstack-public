import type { ReactElement } from "react";

import { cn } from "../utils";

import { Dropdown } from "./overlays";
import { Button } from "./primitives";

type DropdownProps = React.ComponentProps<typeof Dropdown>;
type ButtonProps = React.ComponentProps<typeof Button>;

export interface LanguageDropdownOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface LanguageDropdownProps {
  value: string;
  options: LanguageDropdownOption[];
  onSelect: (value: string) => void;
  ariaLabel?: string;
  ariaLabelledBy?: string;
  className?: string;
  buttonClassName?: string;
  dropdownClassName?: string;
  dropdownContentClassName?: string;
  placement?: DropdownProps["placement"];
  buttonVariant?: ButtonProps["variant"];
  buttonSize?: ButtonProps["size"];
}

export const LanguageDropdown = ({
  value,
  options,
  onSelect,
  ariaLabel,
  ariaLabelledBy,
  className,
  buttonClassName,
  dropdownClassName,
  dropdownContentClassName,
  placement = "bottom-start",
  buttonVariant = "primary",
  buttonSize = "sm",
}: LanguageDropdownProps): ReactElement => {
  const activeLabel = options.find((option) => option.value === value)?.label ?? value;
  const availableOptions = options.filter((option) => option.value !== value);

  return (
    <div className={cn("inline-flex", className)}>
      <Dropdown
        placement={placement}
        className={cn("min-w-[10px] max-w-[100px]", dropdownClassName)}
        closeOnSelect
        trigger={
          <Button
            variant={buttonVariant}
            size={buttonSize}
            aria-labelledby={ariaLabelledBy}
            aria-label={ariaLabelledBy ? undefined : ariaLabel}
            className={cn("px-3 py-1 text-xs", buttonClassName)}
          >
            {activeLabel}
          </Button>
        }
      >
        <div className={cn("flex flex-col gap-0.5 p-1", dropdownContentClassName)}>
          {availableOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              disabled={option.disabled}
              className={cn(
                "w-full rounded-sm px-2 py-1.5 text-left text-xs text-text-primary hover:bg-surface-secondary",
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-border-focus",
                option.disabled && "opacity-50 cursor-not-allowed",
                "overflow-hidden text-ellipsis whitespace-nowrap",
              )}
              onClick={() => onSelect(option.value)}
              aria-pressed={option.value === value}
            >
              {option.label}
            </button>
          ))}
        </div>
      </Dropdown>
    </div>
  );
};
