import { Button, Text, useI18n } from "@restorio/ui";
import type { ReactElement } from "react";

import type { CartItem } from "../hooks/useCart";

interface CartSummaryProps {
  items: CartItem[];
  totalAmount: number;
  onRemove: (name: string) => void;
  onUpdateQuantity: (name: string, quantity: number) => void;
}

const VAT_RATE = 0.23;

export const CartSummary = ({ items, totalAmount, onRemove, onUpdateQuantity }: CartSummaryProps): ReactElement => {
  const { t } = useI18n();
  const currency = t("common.currency");
  const vatAmount = totalAmount - totalAmount / (1 + VAT_RATE);
  const netAmount = totalAmount - vatAmount;

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-border-default bg-surface-secondary p-4 text-center">
        <Text as="p" variant="body-sm" className="text-text-secondary">
          {t("cart.empty")}
        </Text>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border-default bg-surface-primary">
      <div className="p-3">
        <Text as="h3" variant="body-md" weight="semibold" className="mb-2 text-center">
          {t("cart.title")}
        </Text>
        <div className="flex flex-col gap-2">
          {items.map((item) => (
            <div key={item.name} className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <Text as="span" variant="body-sm" className="block truncate">
                  {item.name}
                </Text>
                <Text as="span" variant="caption">
                  {t("cart.linePrice", {
                    price: item.unitPrice.toFixed(2),
                    currency,
                    quantity: String(item.quantity),
                  })}
                </Text>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onRemove(item.name)}
                  aria-label={t("cart.lessAria", { name: item.name })}
                  className="h-7 w-7 !p-0 text-xs"
                >
                  −
                </Button>
                <span className="w-5 text-center text-xs font-semibold tabular-nums">{item.quantity}</span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onUpdateQuantity(item.name, item.quantity + 1)}
                  aria-label={t("cart.moreAria", { name: item.name })}
                  className="h-7 w-7 !p-0 text-xs"
                >
                  +
                </Button>
                <Text as="span" variant="body-sm" weight="semibold" className="w-16 text-right">
                  {(item.unitPrice * item.quantity).toFixed(2)} {currency}
                </Text>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-1 border-t border-border-default px-6 py-2">
        <div className="flex items-center justify-between">
          <Text as="span" variant="body-sm" className="text-text-secondary">
            {t("cart.netAmount")}
          </Text>
          <Text as="span" variant="body-sm" className="text-text-secondary">
            {netAmount.toFixed(2)} {currency}
          </Text>
        </div>
        <div className="flex items-center justify-between">
          <Text as="span" variant="body-sm" className="text-text-secondary">
            {t("cart.vatAmount", { rate: "23" })}
          </Text>
          <Text as="span" variant="body-sm" className="text-text-secondary">
            {vatAmount.toFixed(2)} {currency}
          </Text>
        </div>
        <div className="flex items-center justify-between pt-1">
          <Text as="span" variant="body-md" weight="semibold">
            {t("cart.total")}
          </Text>
          <Text as="span" variant="body-lg" weight="bold">
            {totalAmount.toFixed(2)} {currency}
          </Text>
        </div>
      </div>
    </div>
  );
};
