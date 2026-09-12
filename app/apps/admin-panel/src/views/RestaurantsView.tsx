import type { FloorCanvas as FloorCanvasType, TenantSummary } from "@restorio/types";
import { Button, FloorCanvas, useI18n } from "@restorio/ui";
import type { ReactElement } from "react";

import { RestaurantListCard } from "../features/floor/RestaurantListCard";

interface RestaurantsViewProps {
  restaurants: TenantSummary[];
  activeCanvasesByTenantId?: Record<string, FloorCanvasType | null>;
  onSelectTenant: (tenant: TenantSummary) => void;
  onAddTenant?: () => void;
}

const PREVIEW_WIDTH = 180;
const PREVIEW_HEIGHT = 120;

const getPreviewTransform = (layout: FloorCanvasType): string => {
  const scaleX = PREVIEW_WIDTH / layout.width;
  const scaleY = PREVIEW_HEIGHT / layout.height;
  const scale = Math.min(scaleX, scaleY);

  return `scale(${scale})`;
};

export const RestaurantsView = ({
  restaurants,
  activeCanvasesByTenantId = {},
  onSelectTenant,
  onAddTenant,
}: RestaurantsViewProps): ReactElement => {
  const { t } = useI18n();

  return (
    <div className="p-6">
      <div className="flex items-center justify-between gap-4 pb-4">
        <Button variant="primary" size="sm" onClick={onAddTenant}>
          {t("restaurantsView.add")}
        </Button>
      </div>
      {restaurants.length === 0 ? (
        <div className="text-center text-sm text-text-tertiary py-8">{t("restaurantsView.empty")}</div>
      ) : (
        <ul className="flex flex-col gap-2">
          {restaurants.map((tenant) => {
            const activeCanvas = activeCanvasesByTenantId[tenant.id];

            return (
              <RestaurantListCard
                key={tenant.id}
                title={tenant.name}
                subtitle={t("restaurantsView.floorCount", { count: tenant.floorCanvasCount })}
                rightContent={
                  activeCanvas ? (
                    <div className="h-[120px] w-[180px] overflow-hidden rounded-md border border-border-default bg-background-secondary">
                      <FloorCanvas
                        layout={activeCanvas}
                        showGrid={false}
                        runtimeTableStyling={false}
                        interactive={false}
                        centered
                        transformStyle={getPreviewTransform(activeCanvas)}
                      />
                    </div>
                  ) : undefined
                }
                onClick={() => onSelectTenant(tenant)}
                ariaLabel={t("restaurantsView.ariaLabel", { name: tenant.name })}
              />
            );
          })}
        </ul>
      )}
    </div>
  );
};
