import type { KitchenOrderEvent } from "@restorio/types";
import { resolveApiBaseUrl } from "@restorio/utils";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";

const buildKitchenWebSocketUrl = (restaurantId: string): string => {
  const apiBase = resolveApiBaseUrl({ preferRelativeInBrowser: true });
  const absolute =
    apiBase.startsWith("/") && typeof window !== "undefined" ? `${window.location.origin}${apiBase}` : apiBase;
  const parsed = new URL(absolute);
  const wsProto = parsed.protocol === "https:" ? "wss:" : "ws:";
  const path = parsed.pathname.replace(/\/$/, "");

  return `${wsProto}//${parsed.host}${path}/ws/kitchen/${restaurantId}`;
};

type WsStatus = "connected" | "disconnected" | "reconnecting";

const BASE_RECONNECT_DELAY = 1000;
const MAX_RECONNECT_DELAY = 30000;

export interface UseKitchenWebSocketReturn {
  status: WsStatus;
}

export const useKitchenWebSocket = (restaurantId: string | null): UseKitchenWebSocketReturn => {
  const [status, setStatus] = useState<WsStatus>("disconnected");
  const wsRef = useRef<WebSocket | null>(null);
  const retryCountRef = useRef(0);
  const queryClient = useQueryClient();

  const handleEvent = useCallback(
    (event: KitchenOrderEvent): void => {
      if (!restaurantId) {
        return;
      }
      void queryClient.invalidateQueries({ queryKey: ["orders", restaurantId] });

      if (event.type === "order_created") {
        void queryClient.invalidateQueries({ queryKey: ["orders", restaurantId] });
      }
    },
    [restaurantId, queryClient],
  );

  useEffect(() => {
    if (!restaurantId) {
      setStatus("disconnected");

      return;
    }

    let shouldReconnect = true;
    let timeoutId: ReturnType<typeof setTimeout>;

    const connect = (): void => {
      const url = buildKitchenWebSocketUrl(restaurantId);

      const ws = new WebSocket(url);

      wsRef.current = ws;

      ws.onopen = (): void => {
        setStatus("connected");
        retryCountRef.current = 0;
      };

      ws.onmessage = (messageEvent): void => {
        try {
          const data = JSON.parse(messageEvent.data as string) as KitchenOrderEvent;

          handleEvent(data);
        } catch {
          // ignore malformed messages
        }
      };

      ws.onclose = (): void => {
        wsRef.current = null;

        if (!shouldReconnect) {
          setStatus("disconnected");

          return;
        }
        setStatus("reconnecting");
        const delay = Math.min(BASE_RECONNECT_DELAY * Math.pow(2, retryCountRef.current), MAX_RECONNECT_DELAY);

        retryCountRef.current += 1;
        timeoutId = setTimeout(connect, delay);
      };

      ws.onerror = (): void => {
        ws.close();
      };
    };

    connect();

    return () => {
      shouldReconnect = false;
      clearTimeout(timeoutId);
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [restaurantId, handleEvent]);

  return { status };
};
