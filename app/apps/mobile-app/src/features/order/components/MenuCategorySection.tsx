import type { TenantMenuCategory } from "@restorio/types";
import { Text } from "@restorio/ui";
import type { ReactElement } from "react";

import type { CartItem } from "../hooks/useCart";

import { MenuItemCard } from "./MenuItemCard";

interface MenuCategorySectionProps {
  category: TenantMenuCategory;
  cartItems: CartItem[];
  onAdd: (name: string, unitPrice: number) => void;
  onRemove: (name: string) => void;
  browseOnly?: boolean;
}

export const MenuCategorySection = ({
  category,
  cartItems,
  onAdd,
  onRemove,
  browseOnly = false,
}: MenuCategorySectionProps): ReactElement => {
  return (
    <section className="mb-6">
      <Text as="h2" variant="h4" weight="semibold" className="mb-3 px-1 text-center">
        {category.name}
      </Text>
      <div className="flex flex-col gap-2">
        {category.items.map((item) => {
          const cartItem = cartItems.find((ci) => ci.name === item.name);

          return (
            <MenuItemCard
              key={item.name}
              item={item}
              quantity={cartItem?.quantity ?? 0}
              onAdd={() => onAdd(item.name, item.price)}
              onRemove={() => onRemove(item.name)}
              browseOnly={browseOnly}
            />
          );
        })}
      </div>
    </section>
  );
};
