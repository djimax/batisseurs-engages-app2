import { useEffect, useRef, useState } from "react";
import type { inferRouterOutputs } from "@trpc/server";
import { trpc } from "@/lib/trpc";
import type { AppRouter } from "../../../server/routers";

type Notification = inferRouterOutputs<AppRouter>["notifications"]["list"]["notifications"][number];
type NotificationMessage = { type: "ready" | "pong" | "notification"; notification?: Notification };

const MAX_RECONNECT_DELAY_MS = 30_000;
const POLLING_INTERVAL_MS = 15_000;

function buildWebSocketUrl() {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}/api/notifications/ws`;
}

export function useNotificationRealtime() {
  const utils = trpc.useUtils();
  const [status, setStatus] = useState<"connecting" | "connected" | "reconnecting" | "polling">("connecting");
  const reconnectTimer = useRef<number | null>(null);
  const pollingTimer = useRef<number | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectAttempt = useRef(0);

  useEffect(() => {
    let disposed = false;

    const refreshFromServer = () => {
      void utils.notifications.list.invalidate();
    };

    const mergeNotification = (notification: Notification) => {
      const update = (current: { notifications: Notification[]; unreadCount: number; limit: number; offset: number } | undefined, unreadOnly: boolean) => {
        if (!current || (unreadOnly && notification.isRead !== 0)) return current;
        if (current.notifications.some((item) => item.id === notification.id)) return current;
        return {
          ...current,
          notifications: [notification, ...current.notifications].slice(0, current.limit),
          unreadCount: notification.isRead === 0 ? current.unreadCount + 1 : current.unreadCount,
        };
      };
      utils.notifications.list.setData({ unreadOnly: false, limit: 50 }, (current) => update(current, false));
      utils.notifications.list.setData({ unreadOnly: true, limit: 50 }, (current) => update(current, true));
    };

    const stopPolling = () => {
      if (pollingTimer.current !== null) window.clearInterval(pollingTimer.current);
      pollingTimer.current = null;
    };

    const startPolling = () => {
      if (pollingTimer.current !== null) return;
      setStatus("polling");
      refreshFromServer();
      pollingTimer.current = window.setInterval(refreshFromServer, POLLING_INTERVAL_MS);
    };

    const scheduleReconnect = () => {
      if (disposed || reconnectTimer.current !== null) return;
      const delay = Math.min(1000 * 2 ** reconnectAttempt.current, MAX_RECONNECT_DELAY_MS);
      reconnectAttempt.current += 1;
      setStatus("reconnecting");
      startPolling();
      reconnectTimer.current = window.setTimeout(() => {
        reconnectTimer.current = null;
        connect();
      }, delay);
    };

    const connect = () => {
      if (disposed || typeof window === "undefined") return;
      setStatus(reconnectAttempt.current === 0 ? "connecting" : "reconnecting");
      const socket = new WebSocket(buildWebSocketUrl());
      socketRef.current = socket;
      socket.addEventListener("open", () => {
        if (disposed) return;
        reconnectAttempt.current = 0;
        setStatus("connected");
        stopPolling();
        socket.send("ping");
      });
      socket.addEventListener("message", (event) => {
        try {
          const payload = JSON.parse(String(event.data)) as NotificationMessage;
          if (payload.type === "notification" && payload.notification) mergeNotification(payload.notification);
        } catch {
          // Ignore malformed frames; the persisted list remains the source of truth.
        }
      });
      socket.addEventListener("error", () => socket.close());
      socket.addEventListener("close", () => {
        if (socketRef.current === socket) socketRef.current = null;
        scheduleReconnect();
      });
    };

    connect();
    return () => {
      disposed = true;
      stopPolling();
      if (reconnectTimer.current !== null) window.clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, [utils]);

  return { status, isLive: status === "connected" };
}
