import type { TenantMenuItem } from "@restorio/types";
import { Button, cn, Modal, Text, useI18n } from "@restorio/ui";
import { useState, type ReactElement } from "react";

interface MenuItemCardProps {
  item: TenantMenuItem;
  quantity: number;
  onAdd: () => void;
  onRemove: () => void;
  browseOnly?: boolean;
}

export const MenuItemCard = ({
  item,
  quantity,
  onAdd,
  onRemove,
  browseOnly = false,
}: MenuItemCardProps): ReactElement => {
  const { t } = useI18n();
  const [detailOpen, setDetailOpen] = useState(false);

  const priceLabel = `${item.price.toFixed(2)} ${t("common.currency")}`;

  const textContent = (
    <div className="flex min-w-0 flex-col items-stretch justify-center gap-2 py-0.5">
      {item.promoted ? (
        <div className="flex w-full justify-end">
          <span className="inline-flex w-fit max-w-full shrink-0 items-center rounded-md border-2 border-status-promoted-border bg-status-promoted-background px-3 py-1.5 text-base font-semibold leading-tight text-status-promoted-text shadow-sm">
            {t("order.promotedBadge")}
          </span>
        </div>
      ) : null}
      <Text as="span" variant="h4" weight="medium" className="line-clamp-2 break-words text-start text-text-primary">
        {item.name}
      </Text>
      <Text as="span" variant="h4" weight="semibold" className="break-words text-start text-text-primary">
        {priceLabel}
      </Text>
      {item.desc.trim() ? (
        <Text as="span" variant="body-md" className="line-clamp-2 break-words text-pretty text-text-tertiary">
          {t("menuItem.tapForDescription")}
        </Text>
      ) : null}
    </div>
  );

  const imageNode = (
    <div className="relative aspect-square w-full overflow-hidden rounded-md bg-surface-secondary">
      {item.imageUrl ? (
        <img src={item.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
      ) : null}
    </div>
  );

  return (
    <>
      <div
        className={cn(
          "rounded-lg border border-border-default bg-surface-primary p-2 sm:p-3",
          browseOnly
            ? ""
            : "grid grid-cols-[min(260px,42vw)_minmax(0,1fr)] gap-x-2 gap-y-2 sm:grid-cols-[260px_minmax(0,1fr)] sm:gap-x-3 sm:gap-y-3",
        )}
      >
        {browseOnly ? (
          <button
            type="button"
            onClick={() => setDetailOpen(true)}
            className="flex min-w-0 items-center gap-2 rounded-md text-start outline-none ring-border-focus focus-visible:ring-2 sm:gap-3"
            aria-label={t("menuItem.openDetailsAria", { name: item.name })}
          >
            <div className="relative aspect-square w-[min(260px,42vw)] shrink-0 overflow-hidden rounded-md bg-surface-secondary sm:w-[260px]">
              {item.imageUrl ? (
                <img src={item.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
              ) : null}
            </div>
            {textContent}
          </button>
        ) : (
          <>
            <div className="row-start-1 col-start-1">{imageNode}</div>
            <button
              type="button"
              onClick={() => setDetailOpen(true)}
              className="row-start-1 col-start-2 min-w-0 rounded-md text-start outline-none ring-border-focus focus-visible:ring-2"
              aria-label={t("menuItem.openDetailsAria", { name: item.name })}
            >
              {textContent}
            </button>
            <div className="col-span-2 row-start-2 flex w-full gap-2">
              {quantity > 0 ? (
                <>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => onRemove()}
                    aria-label={t("menuItem.removeAria", { name: item.name })}
                    className="h-10 min-w-0 flex-1 !px-0 text-lg"
                  >
                    −
                  </Button>
                  <span className="flex h-10 min-w-[2.75rem] flex-1 items-center justify-center rounded-md border border-border-default bg-surface-secondary text-base font-semibold tabular-nums text-text-primary">
                    {quantity}
                  </span>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => onAdd()}
                    aria-label={t("menuItem.addAria", { name: item.name })}
                    className="h-10 min-w-0 flex-1 !px-0 text-lg"
                  >
                    +
                  </Button>
                </>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => onAdd()}
                  aria-label={t("menuItem.addAria", { name: item.name })}
                  className="h-10 w-full !px-0 text-lg"
                >
                  +
                </Button>
              )}
            </div>
          </>
        )}
      </div>

      <Modal
        isOpen={detailOpen}
        onClose={() => setDetailOpen(false)}
        title={item.name}
        size="xl"
        closeButtonAriaLabel={t("menuItem.closeDetailsModal")}
      >
        <div className="flex w-full flex-col items-center gap-5">
          {item.imageUrl ? (
            <div className="flex w-full justify-center">
              <div className="overflow-hidden rounded-lg bg-surface-secondary">
                <img
                  src={item.imageUrl}
                  alt=""
                  className="mx-auto max-h-[min(420px,55vh)] w-auto max-w-full object-contain"
                />
              </div>
            </div>
          ) : null}
          {item.desc.trim() ? (
            <Text
              as="p"
              variant="h3"
              align="center"
              className="w-full max-w-prose break-words whitespace-pre-wrap text-text-primary"
            >
              {item.desc.trim()}
            </Text>
          ) : (
            <Text as="p" variant="body-lg" align="center" className="w-full max-w-prose text-text-secondary">
              {t("menuItem.noDescription")}
            </Text>
          )}
          <Text as="p" variant="h3" weight="semibold" align="center" className="w-full text-text-primary">
            {priceLabel}
          </Text>
        </div>
      </Modal>
    </>
  );
};
