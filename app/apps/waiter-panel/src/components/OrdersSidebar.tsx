import type { ArchivedOrderRow } from "@restorio/api-client";
import { Button, useI18n, cn } from "@restorio/ui";
import { useQuery } from "@tanstack/react-query";
import { useMemo, type ReactElement } from "react";
import { IoIosCloseCircleOutline } from "react-icons/io";

import { ordersApi } from "@/api/client";

interface OrdersSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  venueId: string;
}

export const OrdersSidebar = ({ isOpen, onClose, venueId }: OrdersSidebarProps): ReactElement | null => {
  const { t } = useI18n();

  const { data: orders = [] } = useQuery({
    queryKey: ["waiter-panel", "archived-orders", venueId],
    queryFn: async (): Promise<ArchivedOrderRow[]> => {
      try {
        return await ordersApi.listArchived(venueId, { pageSize: 100, sinceHours: null });
      } catch {
        return [];
      }
    },
    enabled: isOpen,
    refetchInterval: isOpen ? 5000 : false,
  });

  const todaysOrders = useMemo(() => {
    const today = new Date();

    today.setHours(0, 0, 0, 0);

    return orders
      .filter((order) => {
        const orderDate = new Date(order.createdAt);

        return orderDate >= today;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [orders]);

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-surface-overlay/50 transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <div
        className={cn(
          "fixed inset-y-0 right-0 z-50 w-full max-w-sm transform bg-surface-primary shadow-2xl transition-transform duration-300 ease-in-out sm:w-96",
          isOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-border-default p-4">
            <h2 className="text-lg font-semibold text-text-primary">{t("waiterDashboard.todaysOrders")}</h2>
            <Button variant="ghost" size="icon" onClick={onClose} aria-label={t("waiterDashboard.closePanel")}>
              <IoIosCloseCircleOutline className="h-6 w-6" />
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {todaysOrders.length === 0 ? (
              <p className="text-sm text-text-secondary">{t("waiterDashboard.noOrdersToday")}</p>
            ) : (
              <div className="space-y-4">
                {todaysOrders.map((order) => (
                  <div
                    key={order.id}
                    className="rounded-lg border border-border-default bg-background-secondary p-4 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-text-primary">
                        {t("floorEditor.tableLabel", {
                          number: order.tableLabel.split("-").pop() ?? "-",
                        })}
                      </span>
                      <span className="text-sm text-text-secondary">
                        {new Intl.DateTimeFormat("pl-PL", {
                          hour: "2-digit",
                          minute: "2-digit",
                        }).format(new Date(order.createdAt))}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-sm font-medium text-text-primary">
                        {String(order.total)} {order.currency}
                      </span>
                      <span
                        className={cn(
                          "rounded-full px-2 py-1 text-xs font-medium",
                          order.status === "paid"
                            ? "bg-status-success-background text-status-success-text"
                            : "bg-status-warning-background text-status-warning-text",
                        )}
                      >
                        {t(`orders.status.${order.status}` as const, { defaultValue: order.status })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
