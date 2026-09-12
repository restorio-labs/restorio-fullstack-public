import { Button, Modal, useI18n } from "@restorio/ui";
import type { ReactElement } from "react";

interface UnsavedChangesModalProps {
  isOpen: boolean;
  onKeepEditing: () => void;
  onDiscard: () => void;
  isSaving?: boolean;
}

export const UnsavedChangesModal = ({
  isOpen,
  onKeepEditing,
  onDiscard,
  isSaving = false,
}: UnsavedChangesModalProps): ReactElement => {
  const { t } = useI18n();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onKeepEditing}
      title={t("unsavedChanges.title")}
      closeOnOverlayClick={!isSaving}
      closeOnEscape={!isSaving}
    >
      <div className="flex flex-col gap-4">
        <p className="text-sm text-text-secondary">{t("unsavedChanges.message")}</p>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onKeepEditing} disabled={isSaving}>
            {t("unsavedChanges.keepEditing")}
          </Button>
          <Button type="button" variant="danger" onClick={onDiscard} disabled={isSaving}>
            {t("unsavedChanges.discard")}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
