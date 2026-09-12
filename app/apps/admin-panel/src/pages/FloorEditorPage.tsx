import type { FloorCanvas as FloorCanvasType, Tenant } from "@restorio/types";
import { Button, cn, Dropdown, Modal, useI18n, useMediaQuery, useToast, Loader } from "@restorio/ui";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState, type ReactElement } from "react";
import { TbChevronDown } from "react-icons/tb";
import { useNavigate } from "react-router-dom";

import { api } from "../api/client";
import { tenantDetailsQueryKey, useCurrentTenant } from "../context/TenantContext";
import { PageLayout } from "../layouts/PageLayout";
import { FloorLayoutEditorView } from "../views/FloorLayoutEditorView";

const UNSAVED_CHANGES_NAVIGATION_EVENT = "restorio:unsaved-changes-navigation-attempt";

interface UnsavedChangesNavigationAttemptDetail {
  path: string;
  sourcePath: string;
}

const getActiveCanvas = (tenant: Tenant): FloorCanvasType | undefined => {
  const canvases = tenant.floorCanvases;

  if (canvases.length === 0) {
    return undefined;
  }

  return canvases.find((c) => c.id === tenant.activeLayoutVersionId) ?? canvases[0];
};

export const FloorEditorPage = (): ReactElement => {
  const { t } = useI18n();
  const isTabletUp = useMediaQuery("(min-width: 650px)");
  const { selectedTenantId, selectedTenantDetails: tenant, tenantsState, isSelectedTenantLoading } = useCurrentTenant();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [isCreatingCanvas, setIsCreatingCanvas] = useState(false);
  const [isSavingCanvas, setIsSavingCanvas] = useState(false);
  const [headerActions, setHeaderActions] = useState<ReactElement | null>(null);
  const [selectedCanvasId, setSelectedCanvasId] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [pendingCanvasId, setPendingCanvasId] = useState<string | null>(null);
  const [pendingNavigationPath, setPendingNavigationPath] = useState<string | null>(null);
  const [floorNameDraft, setFloorNameDraft] = useState("");
  const [isDeletingCanvas, setIsDeletingCanvas] = useState(false);
  const [isDeleteFloorModalOpen, setIsDeleteFloorModalOpen] = useState(false);
  const [deleteFloorConfirmName, setDeleteFloorConfirmName] = useState("");
  const [isFloorSelectOpen, setIsFloorSelectOpen] = useState(false);
  const { showToast } = useToast();

  const handleHeaderActionsChange = useCallback((actions: ReactElement | null) => {
    setHeaderActions(actions);
  }, []);

  useEffect(() => {
    if (!tenant) {
      setSelectedCanvasId(null);

      return;
    }

    const activeCanvas = getActiveCanvas(tenant);
    const hasSelectedCanvas = selectedCanvasId
      ? tenant.floorCanvases.some((canvas) => canvas.id === selectedCanvasId)
      : false;

    if (hasSelectedCanvas) {
      return;
    }

    setSelectedCanvasId(activeCanvas?.id ?? tenant.floorCanvases[0]?.id);
  }, [selectedCanvasId, tenant]);

  useEffect(() => {
    if (!isDirty) {
      return;
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent): string => {
      event.preventDefault();
      event.returnValue = "";

      return "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isDirty]);

  useEffect(() => {
    if (!tenant || !selectedCanvasId) {
      setFloorNameDraft("");

      return;
    }

    const selectedCanvas = tenant.floorCanvases.find((canvas) => canvas.id === selectedCanvasId);

    setFloorNameDraft(selectedCanvas?.name ?? "");
  }, [selectedCanvasId, tenant]);

  useEffect(() => {
    if (!isDirty) {
      return;
    }

    const handleNavigationAttempt = (event: Event): void => {
      const customEvent = event as CustomEvent<UnsavedChangesNavigationAttemptDetail>;
      const { path: nextPath, sourcePath } = customEvent.detail;

      if (!nextPath || sourcePath !== "/") {
        return;
      }

      event.preventDefault();
      setPendingNavigationPath(nextPath);
    };

    window.addEventListener(UNSAVED_CHANGES_NAVIGATION_EVENT, handleNavigationAttempt as EventListener);

    return () => {
      window.removeEventListener(UNSAVED_CHANGES_NAVIGATION_EVENT, handleNavigationAttempt as EventListener);
    };
  }, [isDirty]);

  const refreshTenantDetails = useCallback(async (): Promise<Tenant | null> => {
    if (!tenant) {
      return null;
    }

    await queryClient.invalidateQueries({ queryKey: tenantDetailsQueryKey(tenant.id) });

    return queryClient.fetchQuery({
      queryKey: tenantDetailsQueryKey(tenant.id),
      queryFn: () => api.tenants.get(tenant.id),
    });
  }, [queryClient, tenant]);

  const buildNextCanvasName = useCallback((): string => {
    const baseName = t("floorEditor.defaultCanvasNameBase");
    const takenNames = new Set((tenant?.floorCanvases ?? []).map((canvas) => canvas.name.trim().toLowerCase()));
    let index = (tenant?.floorCanvases.length ?? 0) + 1;

    while (takenNames.has(`${baseName} ${index}`.trim().toLowerCase())) {
      index += 1;
    }

    return `${baseName} ${index}`;
  }, [t, tenant]);

  const handleCanvasSelectionChange = useCallback(
    (nextCanvasId: string) => {
      if (nextCanvasId === selectedCanvasId) {
        return;
      }

      if (isDirty) {
        setPendingCanvasId(nextCanvasId);

        return;
      }

      setSelectedCanvasId(nextCanvasId);
    },
    [isDirty, selectedCanvasId],
  );

  const handleDiscardPendingCanvasChange = useCallback(() => {
    if (!pendingCanvasId) {
      return;
    }

    const nextCanvas = tenant?.floorCanvases.find((canvas) => canvas.id === pendingCanvasId);

    setSelectedCanvasId(pendingCanvasId);
    setFloorNameDraft(nextCanvas?.name ?? "");
    setPendingCanvasId(null);
    setIsDirty(false);
  }, [pendingCanvasId, tenant]);

  const handleKeepEditing = useCallback(() => {
    setPendingCanvasId(null);
    setPendingNavigationPath(null);
  }, []);

  const handleDiscardNavigation = useCallback(() => {
    setPendingCanvasId(null);

    if (!pendingNavigationPath) {
      return;
    }

    const nextPath = pendingNavigationPath;

    setPendingNavigationPath(null);
    setIsDirty(false);
    navigate(nextPath);
  }, [navigate, pendingNavigationPath]);

  const handleSetActiveCanvas = useCallback(
    async (canvasId: string): Promise<void> => {
      if (!tenant) {
        return;
      }

      await api.tenants.update(tenant.id, { activeLayoutVersionId: canvasId });
    },
    [tenant],
  );

  const handleCreateCanvas = useCallback(async (): Promise<void> => {
    if (!tenant || isCreatingCanvas) {
      return;
    }

    setIsCreatingCanvas(true);

    try {
      const createdCanvas = await api.floorCanvases.create(tenant.id, {
        name: buildNextCanvasName(),
        width: 1000,
        height: 800,
        elements: [],
      });

      await handleSetActiveCanvas(createdCanvas.id);
      const nextTenant = await refreshTenantDetails();
      const nextCanvas = nextTenant?.floorCanvases.find((canvas) => canvas.id === createdCanvas.id);

      setSelectedCanvasId(nextCanvas?.id ?? createdCanvas.id);
    } finally {
      setIsCreatingCanvas(false);
    }
  }, [buildNextCanvasName, handleSetActiveCanvas, isCreatingCanvas, refreshTenantDetails, tenant]);

  const handleSave = useCallback(
    async (layout: FloorCanvasType): Promise<void> => {
      if (!tenant) {
        return;
      }

      setIsSavingCanvas(true);

      try {
        await api.floorCanvases.update(tenant.id, layout.id, {
          name: floorNameDraft.trim() || layout.name,
          width: layout.width,
          height: layout.height,
          elements: layout.elements,
        });
        await handleSetActiveCanvas(layout.id);
        await refreshTenantDetails();
        setSelectedCanvasId(layout.id);
        setIsDirty(false);
        showToast("success", t("floorEditor.saveSuccessTitle"), t("floorEditor.saveSuccessMessage"));
      } catch (error) {
        console.error("Failed to save layout:", error);
        showToast("error", t("floorEditor.saveErrorTitle"), t("floorEditor.saveErrorMessage"));
      } finally {
        setIsSavingCanvas(false);
      }
    },
    [floorNameDraft, handleSetActiveCanvas, refreshTenantDetails, showToast, t, tenant],
  );

  const activeCanvasForEditor = tenant
    ? (tenant.floorCanvases.find((canvas) => canvas.id === selectedCanvasId) ?? getActiveCanvas(tenant) ?? null)
    : null;
  const isFirstFloor =
    tenant && activeCanvasForEditor ? tenant.floorCanvases[0]?.id === activeCanvasForEditor.id : false;
  const isFloorNameChanged = activeCanvasForEditor
    ? floorNameDraft.trim() !== "" && floorNameDraft.trim() !== activeCanvasForEditor.name
    : false;
  const canManageFloor = !isSavingCanvas && !isCreatingCanvas && !isDeletingCanvas;
  const deleteFloorNameMatches =
    activeCanvasForEditor !== null && deleteFloorConfirmName.trim() === activeCanvasForEditor.name.trim();

  const handleDeleteCanvas = useCallback(async (): Promise<boolean> => {
    if (!tenant || !activeCanvasForEditor || isFirstFloor || !canManageFloor) {
      return false;
    }

    const fallbackCanvas = tenant.floorCanvases.find((canvas) => canvas.id !== activeCanvasForEditor.id);

    if (!fallbackCanvas) {
      return false;
    }

    setIsDeletingCanvas(true);

    try {
      await handleSetActiveCanvas(fallbackCanvas.id);
      await api.floorCanvases.delete(tenant.id, activeCanvasForEditor.id);
      await refreshTenantDetails();
      setSelectedCanvasId(fallbackCanvas.id);
      setIsDirty(false);
      showToast("success", t("floorEditor.deleteSuccessTitle"), t("floorEditor.deleteSuccessMessage"));

      return true;
    } catch (error) {
      console.error("Failed to delete floor:", error);
      showToast("error", t("floorEditor.deleteErrorTitle"), t("floorEditor.deleteErrorMessage"));

      return false;
    } finally {
      setIsDeletingCanvas(false);
    }
  }, [
    activeCanvasForEditor,
    canManageFloor,
    handleSetActiveCanvas,
    isFirstFloor,
    refreshTenantDetails,
    showToast,
    t,
    tenant,
  ]);

  const floorCanvasCount = tenant?.floorCanvases.length ?? 0;
  const showFloorPicker = floorCanvasCount > 1;

  const floorSelector = activeCanvasForEditor ? (
    <div className="flex w-full flex-wrap items-center justify-start gap-3">
      {showFloorPicker ? (
        <div className="flex items-center gap-2 text-sm text-text-secondary">
          <span className="shrink-0">{t("floorEditor.floorSelector.label")}</span>
          {!canManageFloor ? (
            <div className="min-w-[180px] max-w-[min(100vw-2rem,20rem)] truncate rounded-md border border-border-default bg-surface-primary px-3 py-2 text-sm text-text-primary opacity-50">
              {activeCanvasForEditor.name}
            </div>
          ) : (
            <Dropdown
              placement="bottom-start"
              portal
              isOpen={isFloorSelectOpen}
              onOpenChange={setIsFloorSelectOpen}
              className="min-w-[180px] max-w-[min(100vw-2rem,20rem)] p-0"
              trigger={
                <div className="flex w-full min-w-[180px] cursor-pointer items-center justify-between gap-2 rounded-md border border-border-default bg-surface-primary py-2 pl-3 pr-3 text-left text-sm text-text-primary transition-colors hover:bg-surface-secondary/50">
                  <span className="min-w-0 flex-1 truncate">{activeCanvasForEditor.name}</span>
                  <TbChevronDown className="size-4 shrink-0 text-text-secondary" aria-hidden />
                </div>
              }
            >
              <div className="flex max-h-[min(18rem,50vh)] flex-col gap-1 overflow-y-auto p-1.5">
                {(tenant?.floorCanvases ?? []).map((canvas) => (
                  <button
                    key={canvas.id}
                    type="button"
                    className={cn(
                      "w-full rounded-md px-3 py-2 text-left text-sm text-text-primary outline-none transition-colors hover:bg-surface-secondary focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-0",
                      canvas.id === activeCanvasForEditor.id && "bg-surface-secondary font-medium",
                    )}
                    onClick={() => {
                      handleCanvasSelectionChange(canvas.id);
                      setIsFloorSelectOpen(false);
                    }}
                  >
                    {canvas.name}
                  </button>
                ))}
              </div>
            </Dropdown>
          )}
        </div>
      ) : null}
      <label className="flex items-center gap-2 text-sm text-text-secondary">
        <span>{t("floorEditor.floorSelector.renameLabel")}</span>
        <input
          type="text"
          value={floorNameDraft}
          onChange={(event) => setFloorNameDraft(event.target.value)}
          className="min-w-[180px] rounded-md border border-border-default bg-surface-primary px-3 py-2 text-sm text-text-primary"
          disabled={!canManageFloor}
        />
      </label>
      <Button
        type="button"
        variant="primary"
        size="sm"
        onClick={() => void handleCreateCanvas()}
        disabled={!canManageFloor}
      >
        {isCreatingCanvas ? t("floorEditor.creatingButton") : t("floorEditor.floorSelector.addFloor")}
      </Button>
      <Button
        type="button"
        variant="danger"
        size="sm"
        onClick={() => {
          setDeleteFloorConfirmName("");
          setIsDeleteFloorModalOpen(true);
        }}
        disabled={isFirstFloor || !canManageFloor || isDirty || isFloorNameChanged}
      >
        {isDeletingCanvas ? t("floorEditor.deletingButton") : t("floorEditor.floorSelector.deleteFloor")}
      </Button>
    </div>
  ) : null;

  if (!isTabletUp) {
    return (
      <PageLayout title={t("floorEditor.title")}>
        <div className="flex flex-1 items-center justify-center p-8">
          <div className="max-w-md rounded-lg border border-border-default bg-surface-primary p-6 text-center">
            <h2 className="text-lg font-semibold text-text-primary">{t("floorEditor.mobileUnavailableTitle")}</h2>
            <p className="mt-2 text-sm text-text-secondary">{t("floorEditor.mobileUnavailableMessage")}</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (tenantsState === "loading" || tenantsState === "idle" || isSelectedTenantLoading) {
    return (
      <PageLayout title={t("floorEditor.title")} description={t("floorEditor.loadingDescription")}>
        <div className="flex flex-1 flex-col gap-4 items-center justify-center p-8">
          <Loader />
          <div className="text-sm text-text-tertiary">{t("floorEditor.loadingRestaurant")}</div>
        </div>
      </PageLayout>
    );
  }

  if (!selectedTenantId) {
    return (
      <PageLayout title={t("floorEditor.title")} description={t("floorEditor.noRestaurantDescription")}>
        <div className="flex flex-1 items-center justify-center p-8 text-center text-sm text-text-tertiary">
          {t("floorEditor.noRestaurantMessage")}
        </div>
      </PageLayout>
    );
  }

  if (tenantsState === "error") {
    return (
      <PageLayout title={t("floorEditor.title")} description={t("floorEditor.errorDescription")}>
        <div className="flex flex-1 items-center justify-center p-8 text-center text-sm text-text-tertiary">
          {t("floorEditor.errorMessage")}
        </div>
      </PageLayout>
    );
  }

  if (!tenant) {
    return (
      <PageLayout title={t("floorEditor.title")} description={t("floorEditor.errorDescription")}>
        <div className="flex flex-1 items-center justify-center p-8 text-center text-sm text-text-tertiary">
          {t("floorEditor.errorMessage")}
        </div>
      </PageLayout>
    );
  }

  const hasCanvases = tenant.floorCanvases.length > 0;

  if (!hasCanvases) {
    return (
      <PageLayout
        title={t("floorEditor.title")}
        description={tenant.name}
        headerActions={
          <button
            type="button"
            onClick={() => void handleCreateCanvas()}
            disabled={isCreatingCanvas}
            className="rounded-md bg-interactive-primary px-4 py-2 text-sm font-medium text-primary-inverse hover:bg-interactive-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus disabled:opacity-50"
          >
            {isCreatingCanvas ? t("floorEditor.creatingButton") : t("floorEditor.createButton")}
          </button>
        }
      >
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
          <p className="text-sm text-text-tertiary">{t("floorEditor.emptyMessage")}</p>
        </div>
      </PageLayout>
    );
  }

  return (
    <>
      <PageLayout
        title={t("floorEditor.layoutTitle", { name: activeCanvasForEditor!.name })}
        description={tenant.name}
        headerActions={headerActions}
      >
        <FloorLayoutEditorView
          initialLayout={activeCanvasForEditor!}
          onSave={handleSave}
          onHeaderActionsChange={handleHeaderActionsChange}
          onDirtyChange={(nextIsDirty) => setIsDirty(nextIsDirty || isFloorNameChanged)}
          extraControls={floorSelector}
        />
      </PageLayout>
      <Modal
        isOpen={pendingCanvasId !== null || pendingNavigationPath !== null}
        onClose={handleKeepEditing}
        title={t("floorEditor.unsavedChanges.title")}
        closeOnOverlayClick={!isSavingCanvas}
        closeOnEscape={!isSavingCanvas}
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-text-secondary">{t("floorEditor.unsavedChanges.message")}</p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={handleKeepEditing} disabled={isSavingCanvas}>
              {t("floorEditor.unsavedChanges.keepEditing")}
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={pendingCanvasId !== null ? handleDiscardPendingCanvasChange : handleDiscardNavigation}
              disabled={isSavingCanvas}
            >
              {t("floorEditor.unsavedChanges.discard")}
            </Button>
          </div>
        </div>
      </Modal>
      <Modal
        isOpen={isDeleteFloorModalOpen}
        onClose={() => {
          if (isDeletingCanvas) {
            return;
          }

          setIsDeleteFloorModalOpen(false);
          setDeleteFloorConfirmName("");
        }}
        title={t("floorEditor.deleteConfirm.title")}
        size="sm"
        closeOnOverlayClick={!isDeletingCanvas}
        closeOnEscape={!isDeletingCanvas}
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-text-secondary">
            {t("floorEditor.deleteConfirm.message", { name: activeCanvasForEditor?.name ?? "" })}
          </p>
          <label className="flex flex-col gap-1.5 text-sm text-text-secondary">
            <span>{t("floorEditor.deleteConfirm.inputLabel")}</span>
            <input
              type="text"
              value={deleteFloorConfirmName}
              onChange={(event) => setDeleteFloorConfirmName(event.target.value)}
              autoComplete="off"
              disabled={isDeletingCanvas}
              className="rounded-md border border-border-default bg-surface-primary px-3 py-2 text-sm text-text-primary"
            />
          </label>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsDeleteFloorModalOpen(false);
                setDeleteFloorConfirmName("");
              }}
              disabled={isDeletingCanvas}
            >
              {t("floorEditor.deleteConfirm.cancel")}
            </Button>
            <Button
              type="button"
              variant="danger"
              disabled={!deleteFloorNameMatches || isDeletingCanvas}
              onClick={() => {
                void (async (): Promise<void> => {
                  const ok = await handleDeleteCanvas();

                  if (ok) {
                    setIsDeleteFloorModalOpen(false);
                    setDeleteFloorConfirmName("");
                  }
                })();
              }}
            >
              {isDeletingCanvas ? t("floorEditor.deletingButton") : t("floorEditor.deleteConfirm.confirm")}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};
