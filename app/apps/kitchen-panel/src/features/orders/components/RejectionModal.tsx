import { Button, Modal, Stack, Text, useI18n } from "@restorio/ui";
import { useState, type ReactElement } from "react";

interface RejectionModalProps {
  isOpen: boolean;
  orderId: string;
  labels: string[];
  onConfirm: (orderId: string, reason: string) => void;
  onClose: () => void;
}

export const RejectionModal = ({
  isOpen,
  orderId,
  labels,
  onConfirm,
  onClose,
}: RejectionModalProps): ReactElement | null => {
  const { t } = useI18n();
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [customReason, setCustomReason] = useState("");

  const handleConfirm = (): void => {
    const reason = selectedReason === "__custom" ? customReason.trim() : selectedReason;

    if (!reason) {
      return;
    }
    onConfirm(orderId, reason);
    setSelectedReason(null);
    setCustomReason("");
    onClose();
  };

  const handleClose = (): void => {
    setSelectedReason(null);
    setCustomReason("");
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t("orders.rejection.title")}>
      <Stack spacing="md" className="p-4">
        <Text as="p" variant="body-sm" className="text-text-secondary">
          {t("orders.rejection.selectReason")}
        </Text>

        <div className="flex flex-wrap gap-2">
          {labels.map((label) => (
            <button
              key={label}
              type="button"
              onClick={() => setSelectedReason(label)}
              className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                selectedReason === label
                  ? "border-border-focus bg-surface-active text-text-primary"
                  : "border-border-default bg-surface-secondary text-text-secondary hover:bg-surface-hover"
              }`}
            >
              {label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setSelectedReason("__custom")}
            className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
              selectedReason === "__custom"
                ? "border-border-focus bg-surface-active text-text-primary"
                : "border-border-default bg-surface-secondary text-text-secondary hover:bg-surface-hover"
            }`}
          >
            {t("orders.rejection.customReason")}
          </button>
        </div>

        {selectedReason === "__custom" && (
          <textarea
            value={customReason}
            onChange={(event) => setCustomReason(event.target.value)}
            className="w-full rounded-md border border-border-default bg-surface-primary px-3 py-2 text-sm text-text-primary"
            rows={3}
            autoFocus
          />
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="ghost" onClick={handleClose}>
            {t("common.cancel")}
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirm}
            disabled={!selectedReason || (selectedReason === "__custom" && !customReason.trim())}
          >
            {t("orders.rejection.confirm")}
          </Button>
        </div>
      </Stack>
    </Modal>
  );
};
