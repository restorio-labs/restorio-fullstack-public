import type { TenantMenuCategory } from "@restorio/types";
import { Box, Stack, Switch, Text, useI18n, Loader } from "@restorio/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ReactElement } from "react";
import { useParams } from "react-router-dom";

import { api } from "../../api/client";

const menuQueryKey = (tenantId: string): readonly string[] => ["tenant-menu", tenantId];

export const MenuAvailabilityView = (): ReactElement => {
  const params = useParams();
  const tenantId = params.tenantId ?? "";
  const { t } = useI18n();
  const queryClient = useQueryClient();

  const { data: menuData, isLoading } = useQuery({
    queryKey: menuQueryKey(tenantId),
    queryFn: () => api.menus.get(tenantId),
    enabled: Boolean(tenantId),
  });

  const toggleMutation = useMutation({
    mutationFn: async (params: { categoryOrder: number; itemName: string; isAvailable: boolean }) =>
      api.menus.toggleItemAvailability(tenantId, params.categoryOrder, params.itemName, params.isAvailable),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: menuQueryKey(tenantId) });
    },
  });

  const categories: TenantMenuCategory[] = menuData?.categories ?? [];

  return (
    <div className="h-full flex flex-col">
      <div className="flex-shrink-0 px-6 py-4 border-b border-border-default bg-surface-primary">
        <Text as="h1" variant="h3" weight="semibold">
          {t("menu.title")}
        </Text>
        <Text as="p" variant="body-sm" className="text-text-secondary">
          {t("menu.description")}
        </Text>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {isLoading && (
          <div className="flex items-center gap-2">
            <Loader size="sm" />
            <Text as="p" variant="body-md" className="text-text-secondary">
              {t("menu.loading")}
            </Text>
          </div>
        )}

        {!isLoading && categories.length === 0 && (
          <Box className="rounded-lg border border-dashed border-border-default p-6 text-center">
            <Text as="p" variant="body-md" className="text-text-secondary">
              {t("menu.noMenu")}
            </Text>
          </Box>
        )}

        <Stack spacing="lg">
          {categories.map((category) => (
            <Box
              key={`${category.order}-${category.name}`}
              className="rounded-xl border border-border-default bg-surface-secondary/60 p-4"
            >
              <Text as="h2" variant="h4" weight="semibold" className="mb-4">
                {category.name}
              </Text>
              <Stack spacing="sm">
                {category.items.map((item) => {
                  const available = item.isAvailable !== false;

                  return (
                    <Box
                      key={`${category.order}-${item.name}`}
                      className={`flex items-center justify-between rounded-lg border border-border-default bg-surface-primary px-4 py-3 ${
                        !available ? "opacity-50" : ""
                      }`}
                    >
                      <Stack spacing="xs">
                        <Text
                          as="p"
                          variant="body-md"
                          weight="medium"
                          className={!available ? "line-through text-text-secondary" : ""}
                        >
                          {item.name}
                        </Text>
                        <Text as="p" variant="body-sm" className="text-text-secondary">
                          {item.price.toFixed(2)} PLN
                          {item.desc && ` · ${item.desc}`}
                        </Text>
                      </Stack>
                      <Switch
                        checked={available}
                        onChange={() =>
                          toggleMutation.mutate({
                            categoryOrder: category.order,
                            itemName: item.name,
                            isAvailable: !available,
                          })
                        }
                        label={t("menu.toggleAvailability")}
                      />
                    </Box>
                  );
                })}
              </Stack>
            </Box>
          ))}
        </Stack>
      </div>
    </div>
  );
};
