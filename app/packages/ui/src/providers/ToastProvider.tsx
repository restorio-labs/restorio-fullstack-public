import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";

import {
  Toast,
  ToastAnimated,
  ToastContainer,
  type ToastPosition,
  type ToastVariant,
} from "../components/overlays/Toast";
import { createToastId } from "../components/overlays/Toast/createToastId";

const DEFAULT_DURATION_MS = 4500;
const TOAST_EXIT_MS = 260;

export interface ShowToastInput {
  variant: ToastVariant;
  title: string;
  description?: string;
  durationMs?: number;
}

interface ToastItem extends ShowToastInput {
  id: string;
  exiting?: boolean;
}

interface ToastContextValue {
  showToast: (variant: ToastVariant, title: string, description?: string, durationMs?: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

interface ToastProviderProps {
  children: ReactNode;
  position?: ToastPosition;
}

export const ToastProvider = ({ children, position = "top-right" }: ToastProviderProps): ReactElement => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timerIdsRef = useRef<Map<string, number>>(new Map());
  const exitTimersRef = useRef<Map<string, number>>(new Map());

  const commitRemoveToast = useCallback((id: string): void => {
    const exitTimerId = exitTimersRef.current.get(id);

    if (exitTimerId !== undefined) {
      window.clearTimeout(exitTimerId);
      exitTimersRef.current.delete(id);
    }

    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const startDismissToast = useCallback(
    (id: string): void => {
      const timerId = timerIdsRef.current.get(id);

      if (timerId !== undefined) {
        window.clearTimeout(timerId);
        timerIdsRef.current.delete(id);
      }

      const existingExit = exitTimersRef.current.get(id);

      if (existingExit !== undefined) {
        window.clearTimeout(existingExit);
        exitTimersRef.current.delete(id);
      }

      setToasts((current) => current.map((toast) => (toast.id === id ? { ...toast, exiting: true } : toast)));

      const exitTimerId = window.setTimeout(() => {
        exitTimersRef.current.delete(id);
        commitRemoveToast(id);
      }, TOAST_EXIT_MS);

      exitTimersRef.current.set(id, exitTimerId);
    },
    [commitRemoveToast],
  );

  const showToast = useCallback(
    (variant: ToastVariant, title: string, description?: string, durationMs?: number): void => {
      const id = createToastId();
      const nextToast: ToastItem = { id, variant, title, description, durationMs };
      const timeoutMs = durationMs ?? DEFAULT_DURATION_MS;

      setToasts((current) => [...current, nextToast]);

      const timerId = window.setTimeout(() => {
        startDismissToast(id);
      }, timeoutMs);

      timerIdsRef.current.set(id, timerId);
    },
    [startDismissToast],
  );

  useEffect(() => {
    const timerIds = timerIdsRef.current;
    const exitTimers = exitTimersRef.current;

    return () => {
      timerIds.forEach((tid) => {
        window.clearTimeout(tid);
      });
      timerIds.clear();
      exitTimers.forEach((tid) => {
        window.clearTimeout(tid);
      });
      exitTimers.clear();
    };
  }, []);

  const contextValue = useMemo<ToastContextValue>(
    () => ({
      showToast,
    }),
    [showToast],
  );

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastContainer position={position}>
        {toasts.map((toast) => (
          <ToastAnimated key={toast.id} exiting={toast.exiting === true}>
            <Toast
              variant={toast.variant}
              title={toast.title}
              description={toast.description}
              onClose={(): void => startDismissToast(toast.id)}
            />
          </ToastAnimated>
        ))}
      </ToastContainer>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextValue => {
  const context = useContext(ToastContext);

  if (context === null) {
    throw new Error("useToast must be used within a ToastProvider");
  }

  return context;
};
