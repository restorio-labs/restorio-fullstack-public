import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export const UNSAVED_CHANGES_NAVIGATION_EVENT = "restorio:unsaved-changes-navigation-attempt";

export interface UnsavedChangesNavigationAttemptDetail {
  path: string;
  sourcePath: string;
}

interface UseUnsavedChangesGuardOptions {
  isDirty: boolean;
  onDiscard?: () => void;
}

interface UseUnsavedChangesGuardReturn {
  pendingNavigationPath: string | null;
  handleKeepEditing: () => void;
  handleDiscardChanges: () => void;
}

export const useUnsavedChangesGuard = ({
  isDirty,
  onDiscard,
}: UseUnsavedChangesGuardOptions): UseUnsavedChangesGuardReturn => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [pendingNavigationPath, setPendingNavigationPath] = useState<string | null>(null);

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
    if (!isDirty) {
      return;
    }

    const handleNavigationAttempt = (event: Event): void => {
      const customEvent = event as CustomEvent<UnsavedChangesNavigationAttemptDetail>;
      const { path: nextPath, sourcePath } = customEvent.detail;

      if (!nextPath || sourcePath !== pathname) {
        return;
      }

      event.preventDefault();
      setPendingNavigationPath(nextPath);
    };

    window.addEventListener(UNSAVED_CHANGES_NAVIGATION_EVENT, handleNavigationAttempt as EventListener);

    return () => {
      window.removeEventListener(UNSAVED_CHANGES_NAVIGATION_EVENT, handleNavigationAttempt as EventListener);
    };
  }, [isDirty, pathname]);

  const handleKeepEditing = useCallback(() => {
    setPendingNavigationPath(null);
  }, []);

  const handleDiscardChanges = useCallback(() => {
    if (!pendingNavigationPath) {
      return;
    }

    const nextPath = pendingNavigationPath;

    setPendingNavigationPath(null);
    onDiscard?.();
    navigate(nextPath);
  }, [navigate, onDiscard, pendingNavigationPath]);

  return {
    pendingNavigationPath,
    handleKeepEditing,
    handleDiscardChanges,
  };
};
