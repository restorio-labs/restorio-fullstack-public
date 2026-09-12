import type { TransactionListItem } from "@restorio/types";
import { Button, Loader, Text, useI18n } from "@restorio/ui";
import type { ReactElement } from "react";

import { useTransactions } from "../hooks/useTransactions";

type TransactionStatusCode = 0 | 1 | 2 | 3;

const formatDateTime = (value: string): string => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("pl-PL", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const formatAmount = (amount: number): string =>
  new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency: "PLN",
  }).format(amount / 100);

const toTransactionStatusCode = (value: unknown): TransactionStatusCode | null => {
  if (value === 0 || value === 1 || value === 2 || value === 3) {
    return value;
  }

  return null;
};

const TransactionListItemRow = ({ transaction }: { transaction: TransactionListItem }): ReactElement => {
  const { t } = useI18n();
  const statusCode = toTransactionStatusCode(transaction.status);
  const statusLabel =
    statusCode === null
      ? `${t("transactions.status.unknown")} (${transaction.status})`
      : t(`transactions.status.${statusCode}`);

  return (
    <li key={transaction.session_id} className="py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-medium text-text-primary">{formatAmount(transaction.amount)}</span>
        <span className="text-xs text-text-secondary">{formatDateTime(transaction.created_at)}</span>
      </div>
      <div className="mt-1 text-sm text-text-secondary">{transaction.email}</div>
      <div className="mt-1 text-xs text-text-tertiary">{transaction.description}</div>
      <div className="mt-1 flex flex-wrap gap-3 text-xs text-text-tertiary">
        <span>
          {t("transactions.fields.status")}: {statusLabel}
        </span>
        <span>
          {t("transactions.fields.orderId")}: {transaction.p24_order_id ?? "-"}
        </span>
        {transaction.note ? (
          <span>
            {t("transactions.fields.note")}: {transaction.note}
          </span>
        ) : null}
      </div>
    </li>
  );
};

export const TransactionListContent = (): ReactElement => {
  const { t } = useI18n();
  const { selectedTenantId, transactions, isLoading, isFetching, isError, page, setPage, total, totalPages } =
    useTransactions();

  const effectiveTotalPages = totalPages > 0 ? totalPages : 1;

  return (
    <div className="w-full p-6">
      <div className="rounded-lg border border-border-default">
        <div className="border-b border-border-default px-5 py-4 text-sm font-medium text-text-secondary">
          {t("transactions.list.title")}
        </div>
        <div className="px-4 py-3">
          {isLoading && (
            <div className="flex items-center gap-2 text-sm text-text-tertiary">
              <Loader size="sm" />
              <span>{t("transactions.list.loading")}</span>
            </div>
          )}
          {!isLoading && selectedTenantId === null && (
            <p className="text-sm text-text-tertiary">{t("transactions.list.selectTenant")}</p>
          )}
          {!isLoading && isError && <p className="text-sm text-status-error-text">{t("transactions.list.error")}</p>}
          {!isLoading && !isError && selectedTenantId !== null && transactions.length === 0 && (
            <p className="text-sm px-4 text-text-tertiary">{t("transactions.list.empty")}</p>
          )}
          {!isLoading && !isError && transactions.length > 0 && (
            <ul className="m-0 list-none divide-y divide-border-default p-0">
              {transactions.map((transaction) => (
                <TransactionListItemRow key={transaction.session_id} transaction={transaction} />
              ))}
            </ul>
          )}
          {!isLoading && !isError && selectedTenantId !== null && total > 0 && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border-default pt-4">
              <Text as="p" variant="body-sm" className="text-text-secondary">
                {t("transactions.list.paginationSummary", {
                  page,
                  pages: effectiveTotalPages,
                  total,
                })}
              </Text>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1 || isFetching}
                >
                  {t("transactions.list.previous")}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={isFetching || page >= effectiveTotalPages}
                >
                  {t("transactions.list.next")}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
