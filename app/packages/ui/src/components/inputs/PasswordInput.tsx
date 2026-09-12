import { forwardRef, useState, type ComponentType, type ReactElement, type SVGProps } from "react";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";

import { cn } from "../../utils";

import { Input, type InputProps } from "./Input";

const EyeInvisibleIcon = AiOutlineEyeInvisible as ComponentType<SVGProps<SVGSVGElement>>;
const EyeIcon = AiOutlineEye as ComponentType<SVGProps<SVGSVGElement>>;

export type PasswordInputProps = Omit<InputProps, "type" | "endAdornment"> & {
  showPasswordAriaLabel?: string;
  hidePasswordAriaLabel?: string;
};

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  (
    { showPasswordAriaLabel = "Show password", hidePasswordAriaLabel = "Hide password", className, ...props },
    ref,
  ): ReactElement => {
    const [visible, setVisible] = useState(false);

    return (
      <Input
        ref={ref}
        type={visible ? "text" : "password"}
        className={className}
        endAdornment={
          <button
            type="button"
            onClick={() => {
              setVisible((v) => !v);
            }}
            className={cn(
              "inline-flex size-9 shrink-0 items-center justify-center rounded-md",
              "text-text-secondary transition-colors hover:text-text-primary",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-1",
            )}
            aria-label={visible ? hidePasswordAriaLabel : showPasswordAriaLabel}
            aria-pressed={visible}
          >
            {visible ? <EyeInvisibleIcon className="size-5" aria-hidden /> : <EyeIcon className="size-5" aria-hidden />}
          </button>
        }
        {...props}
      />
    );
  },
);

PasswordInput.displayName = "PasswordInput";
